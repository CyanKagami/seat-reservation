// src/routes/api/booking/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchData } from '$lib/scripts/server/dynamo';
import {
  bookingErrorResponse,
  cancelSeat,
  checkInWithSeatId,
  checkInWithStudentId,
  fetchUserSummaries,
  isValidSeatId,
  listReservations,
  readCheckInRequest,
  readSeatRequest,
  reserveSeat,
  withSeatParts
} from '$lib/scripts/server/reservation';
import type { Event } from '$lib/type/event';

// Registration window = event['register-date'].start / .end.
// Caveat: a value without a timezone (e.g. "2026-10-20T09:00" from a datetime-local
// input) is read in the SERVER's timezone, so store ISO strings with an offset.
function registrationOpen(ev: Event, now = new Date()) {
  const start = ev['register-date']?.start;
  const end = ev['register-date']?.end;
  if (start && now < new Date(start)) return false;
  if (end && now > new Date(end)) return false;
  return true;
}


function registrationOngoing(ev: Event, now = new Date()) {
  const start = ev.date.start;
  const end = ev.date.end;
  if (start && now < new Date(start)) return false;
  if (end && now > new Date(end)) return false;
  return true;
}



// POST /api/booking/check-in  { eventId, identifier }  (identifier = "<zone>-<seat>" || "xxxxxxxx") - check-in a reserved seat
export const POST: RequestHandler = async (event) => {
  const user = await guard(event, ['organizer', 'admin']);
  if (user instanceof Response) return user;

  const input = await readCheckInRequest(event.request);
  if (input instanceof Response) return input;

  try {
    const ev = (await fetchData('events', { eventId: input.eventId })) as Event | null;
    if (!ev) return json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });

    if (!registrationOngoing(ev)) { 
      return json({ error: 'กิจกรรมนี้ไม่ได้กำลังดำเนินการอยู่' }, { status: 403 });
    }
    const reservation = await (input.identifierType === "SeatId" ? checkInWithSeatId(ev.eventId, input.identifier) : checkInWithStudentId(ev.eventId, input.identifier))
    return json({ message: 'Check-in completed', reservation: withSeatParts(reservation)  }, { status: 201 });
  } catch (error) {
    return json({}, {status:500});
  }
};
