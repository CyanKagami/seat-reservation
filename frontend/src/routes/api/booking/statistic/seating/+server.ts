// src/routes/api/booking/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchData } from '$lib/scripts/server/dynamo';
import {
  bookingErrorResponse,
  cancelSeat,
  fetchUserSummaries,
  isValidSeatId,
  listReservations,
  readSeatRequest,
  reserveSeat,
  withSeatParts
} from '$lib/scripts/server/reservation';
import type { Event } from '$lib/type/event';
import { readFileAsByteArray } from '$lib/scripts/server/s3';
import { decode } from '@msgpack/msgpack';
import type { CanvasObject } from '$lib/components/canvas-shared/types';
import type { Reservation } from '$lib/type/reservation';
import { getSeatId } from '$lib/components/zone-editor/utils/zoneUtils';


const FACULTY_MAP:Record<string,string> = {
  "01": "คณะวิศวกรรมศาสตร์",
  "02": "คณะสถาปัตยกรรม ศิลปะและการออกแบบ",
  "03": "คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี",
  "04": "คณะเทคโนโลยีการเกษตร",
  "05": "คณะวิทยาศาสตร์",
  "06": "คณะอุตสาหกรรมอาหาร",
  "07": "คณะเทคโนโลยีสารสนเทศ",
  "08": "คณะบริหารธุรกิจ",
  "09": "คณะศิลปศาสตร์",
  "10": "วิทยาลัยเทคโนโลยีและนวัตกรรมวัสดุ",
  "11": "วิทยาลัยนวัตกรรมการผลิตขั้นสูง",
  "12": "วิทยาลัยอุตสาหกรรมการบินนานาชาติ",
  "13": "คณะแพทยศาสตร์",
  "14": "คณะทันตแพทยศาสตร์",
  "15": "คณะพยาบาลศาสตร์",
  "31": "วิทยาเขตชุมพรเขตอุดมศักดิ์"
};



function GetZoneMetaData(objects:CanvasObject[], takenId: Set<string>){
    const groups: Record<
      string,
      {
        id:string,
        name:string
        capacity:number;
        takenCount:number;
        isUnavailableZone?: boolean;
        isNoZone?: boolean;
      }
    > = {};
    objects.forEach((obj) => {
      if (obj.type === "seat") {
        const isAvailable = (obj.metadata?.status ?? "available") === "available";

        if (!isAvailable) {
          const uId = "zone-unavailable";
          if (!groups[uId]) {
            groups[uId] = {
              id: uId,
              name: "ไม่ว่าง / Reserved",
              capacity: 0,
              takenCount:0,
              isUnavailableZone: true,
            };
          }
          groups[uId].capacity += 1;
        } else if (obj.metadata?.zone) {
          const zId = obj.metadata.zone;
          if (!groups[zId]) {
            groups[zId] = {
              id: zId,
              name: obj.metadata?.zone ?? "โซนทั่วไป",
              capacity: 0,
              takenCount:0
            };
          }
          groups[zId].capacity += 1;
          if (takenId.has(`${obj.metadata.zone}-${getSeatId(obj)}`)){
            groups[zId].takenCount += 1;
          }
        } else {
          // Available seat with no zone assigned
          const noZoneId = "zone-no-zone";
          if (!groups[noZoneId]) {
            groups[noZoneId] = {
              id: noZoneId,
              name: "ไม่มีโซน / No Zone",
              capacity: 0,
              takenCount:0,
              isNoZone: true,
            };
          }
          groups[noZoneId].capacity += 1;
        }
      }
    });
  return groups;
}

function parseKmitlEmail(email:string) {
  if (typeof email !== "string") {
    return { isValid: false, error: "Input must be a string." };
  }

  // Regex captures 2 digits (year), 2 digits (dept), 4 digits (student ID) before @kmitl.ac.th
  const regex = /^(\d{2})(\d{2})(\d{4})@kmitl\.ac\.th$/i;
  const match = email.trim().match(regex);

  if (!match) {
    return { isValid: false, error: "Invalid KMITL student email format." };
  }

  const [, academicYear, departmentCode, studentId] = match;

  return {
    isValid: true,
    academicYear: academicYear, // e.g., "66"
    departmentCode: departmentCode, // e.g., "01"
    departmentName: FACULTY_MAP[departmentCode] || "Unknown Department",
    studentId: studentId, // e.g., "0001"
    fullStudentCode: `${academicYear}${departmentCode}${studentId}`
  };
}

// GET /api/booking?eventId=...  - seat map data for one event (reserved seats only).
// Everyone gets { seatId, zone, seat, mine }; admin/organizer also get the full record
// (status, googleId, reservedAt) plus the booker's name and email.
export const GET: RequestHandler = async (event) => {
  const user = await guard(event, ['organizer', 'admin']);
  if (user instanceof Response) return user;

  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  try {
    const reservations = await listReservations(eventId);
    const usedSeatId = new Set(reservations.filter((s) => s.status === 'checked-in' || s.status === 'reserved').map((s) => s.seatId));
    let checkedInCount = 0;
    let departmentCount:Record<string, number> = {};
    let yearCount:Record<string, number> = {};
    for (let i = 0; i < reservations.length; i ++){
      const s = reservations[i];
      const owner = parseKmitlEmail(s.email);
      departmentCount[owner.departmentName] = departmentCount[owner.departmentName] ? departmentCount[owner.departmentName] + 1: 1;
      yearCount[owner.academicYear] = yearCount[owner.academicYear] ? yearCount[owner.academicYear] + 1: 1;
      if (s.status === 'checked-in'){
        checkedInCount += 1;
        usedSeatId.add(s.seatId);
      }
      else if (s.status === 'reserved'){
        usedSeatId.add(s.seatId);
      }
    }

    let mostParticipatedFaculty = Object.keys(departmentCount).reduce((a, b) => departmentCount[a] > departmentCount[b] ? a : b)
    let mostParticipatedYear = Object.keys(yearCount).reduce((a, b) => yearCount[a] > yearCount[b] ? a : b)
    let layout = await readFileAsByteArray(`layouts/event`, `${eventId}.msgpack`);
    let layoutMetadata = GetZoneMetaData(decode(layout).objects as CanvasObject[], usedSeatId);
    
    return json({
      body: {
        zoneData: layoutMetadata,
        totalReservation:reservations.length,
        checkedInCount:checkedInCount,
        demographic: {
          mostParticipatedFaculty: {name: mostParticipatedFaculty, count:departmentCount[mostParticipatedFaculty]},
          mostParticipatedYear: {name: mostParticipatedYear, count:yearCount[mostParticipatedYear]}
        }
      }});
  } catch (error) {
    return bookingErrorResponse(error);
  }
};
