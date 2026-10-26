// services/booking/app.js
import express from 'express';
import cors from 'cors';
import { decode } from '@msgpack/msgpack';
import {
  requireAuth,
  requireRole,
  fetchData,
  updateAllAttributes,
  readFileAsByteArray,
  SLOT_PREFIX,
  BookingError,
  CheckInError,
  bookingErrorResponse,
  checkInErrorResponse,
  readSeatRequest,
  readCheckInRequest,
  reserveSeat,
  cancelSeat,
  checkInWithSeatId,
  checkInWithStudentId,
  listReservations,
  listUserReservations,
  getUserSeat,
  fetchUserSummaries,
  fetchEventSummaries,
  withSeatParts,
  isValidSeatId,
  classifyIdentifier,
} from '/opt/nodejs/index.js';

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());

// All booking routes require authentication.
app.use(requireAuth);

const router = express.Router();

// Registration window helper.
function registrationOpen(ev, now = new Date()) {
  const start = ev['register-date']?.start;
  const end = ev['register-date']?.end;
  if (start && now < new Date(start)) return false;
  if (end && now > new Date(end)) return false;
  return true;
}

// Event date window helper (for check-in).
function registrationOngoing(ev, now = new Date()) {
  const start = ev.date?.start;
  const end = ev.date?.end;
  if (start && now < new Date(start)) return false;
  if (end && now > new Date(end)) return false;
  return true;
}

// FACULTY_MAP for demographic stats (seating stats endpoint).
const FACULTY_MAP = {
  '01': 'คณะวิศวกรรมศาสตร์',
  '02': 'คณะสถาปัตยกรรม ศิลปะและการออกแบบ',
  '03': 'คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี',
  '04': 'คณะเทคโนโลยีการเกษตร',
  '05': 'คณะวิทยาศาสตร์',
  '06': 'คณะอุตสาหกรรมอาหาร',
  '07': 'คณะเทคโนโลยีสารสนเทศ',
  '08': 'คณะบริหารธุรกิจ',
  '09': 'คณะศิลปศาสตร์',
  '10': 'วิทยาลัยเทคโนโลยีและนวัตกรรมวัสดุ',
  '11': 'วิทยาลัยนวัตกรรมการผลิตขั้นสูง',
  '12': 'วิทยาลัยอุตสาหกรรมการบินนานาชาติ',
  '13': 'คณะแพทยศาสตร์',
  '14': 'คณะทันตแพทยศาสตร์',
  '15': 'คณะพยาบาลศาสตร์',
  '31': 'วิทยาเขตชุมพรเขตอุดมศักดิ์',
};

function parseKmitlEmail(email) {
  if (typeof email !== 'string') return { isValid: false, error: 'Input must be a string.' };
  const regex = /^(\d{2})(\d{2})(\d{4})@kmitl\.ac\.th$/i;
  const match = email.trim().match(regex);
  if (!match) return { isValid: false, error: 'Invalid KMITL student email format.' };
  const [, academicYear, departmentCode, studentId] = match;
  return {
    isValid: true,
    academicYear,
    departmentCode,
    departmentName: FACULTY_MAP[departmentCode] || 'Unknown Department',
    studentId,
    fullStudentCode: `${academicYear}${departmentCode}${studentId}`
  };
}

function getZoneMetaData(objects, takenId) {
  const groups = {};
  objects.forEach((obj) => {
    if (obj.type === 'seat') {
      const isAvailable = (obj.metadata?.status ?? 'available') === 'available';
      if (!isAvailable) {
        const uId = 'zone-unavailable';
        if (!groups[uId]) groups[uId] = { id: uId, name: 'ไม่ว่าง / Reserved', capacity: 0, takenCount: 0, isUnavailableZone: true };
        groups[uId].capacity += 1;
      } else if (obj.metadata?.zone) {
        const zId = obj.metadata.zone;
        if (!groups[zId]) groups[zId] = { id: zId, name: obj.metadata.zone ?? 'โซนทั่วไป', capacity: 0, takenCount: 0 };
        groups[zId].capacity += 1;
        // Derive seatId the same way as zone-editor: zone-seat (row + seatNo)
        const seatLabel = (obj.metadata?.row && obj.metadata?.seatNo)
          ? `${obj.metadata.row}${obj.metadata.seatNo}`
          : (obj.metadata?.label || obj.id?.replace('seat_', '') || '');
        if (takenId.has(`${obj.metadata.zone}-${seatLabel}`)) groups[zId].takenCount += 1;
      } else {
        const noZoneId = 'zone-no-zone';
        if (!groups[noZoneId]) groups[noZoneId] = { id: noZoneId, name: 'ไม่มีโซน / No Zone', capacity: 0, takenCount: 0, isNoZone: true };
        groups[noZoneId].capacity += 1;
      }
    }
  });
  return groups;
}

// ---- Routes ----
// Specific sub-paths must be registered BEFORE the generic GET /.

// POST /check-in
router.post('/check-in', requireRole('organizer', 'admin'), async (req, res) => {
  const input = readCheckInRequest(req.body);
  if (input.error) return res.status(input.status).json(input.body);

  try {
    const ev = await fetchData('events', { eventId: input.eventId });
    if (!ev) return res.status(404).json({ error: 'ไม่พบกิจกรรม' });
    if (!registrationOngoing(ev)) return res.status(403).json({ error: 'กิจกรรมนี้ไม่ได้กำลังดำเนินการอยู่' });

    const reservation = await (input.identifierType === 'SeatId'
      ? checkInWithSeatId(ev.eventId, input.identifier)
      : checkInWithStudentId(ev.eventId, input.identifier));

    return res.status(201).json({ message: 'Check-in completed', reservation: withSeatParts(reservation) });
  } catch (error) {
    const result = checkInErrorResponse(error);
    return res.status(result.status).json(result.body);
  }
});

// GET /mine
router.get('/mine', async (req, res) => {
  try {
    const reservations = await listUserReservations(req.user.email, req.user.googleId);
    const events = await fetchEventSummaries(reservations.map((r) => r.eventId));
    return res.status(200).json({
      body: reservations.map((r) => withSeatParts({ ...r, event: events.get(r.eventId) ?? null }))
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /registered/me?eventId=
router.get('/registered/me', async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    let seat = await getUserSeat(eventId, req.user.email);
    if (!seat && req.user.googleId) seat = await getUserSeat(eventId, req.user.googleId);
    return res.status(200).json({ body: seat ? { registered: true, ...seat } : { registered: false } });
  } catch (error) {
    const result = checkInErrorResponse(error);
    return res.status(result.status).json(result.body);
  }
});

// GET /registered?eventId=&identifier=
router.get('/registered', requireRole('organizer', 'admin'), async (req, res) => {
  const { eventId, identifier } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  if (!identifier) return res.status(400).json({ error: 'Missing identifier' });

  try {
    const selectedEvent = await fetchData('events', { eventId });
    if (!selectedEvent || (selectedEvent.creatorId !== req.user.email && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = classifyIdentifier(identifier);
    if (result.type === 'StudentId') {
      const slot = await fetchData('reservations', { eventId, seatId: SLOT_PREFIX + result.value + '@kmitl.ac.th' });
      if (!slot) return res.status(404).json({ error: 'ไม่พบการจอง' });
      const reservation = await fetchData('reservations', { eventId, seatId: slot.reservedSeatId });
      if (!reservation) return res.status(404).json({ error: 'ไม่พบการจอง' });
      return res.status(200).json({ body: withSeatParts(reservation) });
    } else if (result.type === 'SeatId') {
      const reservation = await fetchData('reservations', { eventId, seatId: result.value });
      if (!reservation) return res.status(404).json({ error: 'ไม่พบการจอง' });
      return res.status(200).json({ body: withSeatParts(reservation) });
    }

    return res.status(400).json({ error: 'Malformed Identifier', code: 'BAD_REQUEST' });
  } catch (error) {
    console.error('Error fetching registered seat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /statistic/attendance?eventId=
router.get('/statistic/attendance', requireRole('organizer', 'admin'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    const selectedEvent = await fetchData('events', { eventId });
    if (!selectedEvent || (selectedEvent.creatorId !== req.user.email && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const all = await listReservations(eventId);
    const checkInCount = all.reduce((p, r) => (r.status === 'checked-in' ? p + 1 : p), 0);
    const totalCount = all.length;
    return res.status(200).json({ body: { checkInCount, totalCount } });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /statistic/seating?eventId=
router.get('/statistic/seating', requireRole('organizer', 'admin'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    const reservations = await listReservations(eventId);
    const usedSeatId = new Set();
    let checkedInCount = 0;
    const departmentCount = {};
    const yearCount = {};

    for (const s of reservations) {
      const owner = parseKmitlEmail(s.email);
      if (owner.isValid) {
        departmentCount[owner.departmentName] = (departmentCount[owner.departmentName] ?? 0) + 1;
        yearCount[owner.academicYear] = (yearCount[owner.academicYear] ?? 0) + 1;
      }
      if (s.status === 'checked-in') { checkedInCount += 1; usedSeatId.add(s.seatId); }
      else if (s.status === 'reserved') { usedSeatId.add(s.seatId); }
    }

    const layout = await readFileAsByteArray(`layouts/event/${eventId}.msgpack`);
    const layoutMetadata = getZoneMetaData(decode(layout).objects ?? [], usedSeatId);
    const totalCapacity = Object.values(layoutMetadata).reduce((a, z) => a + z.capacity, 0);

    const deptKeys = Object.keys(departmentCount);
    const yearKeys = Object.keys(yearCount);
    const mostParticipatedFaculty = deptKeys.length
      ? deptKeys.reduce((a, b) => departmentCount[a] > departmentCount[b] ? a : b)
      : null;
    const mostParticipatedYear = yearKeys.length
      ? yearKeys.reduce((a, b) => yearCount[a] > yearCount[b] ? a : b)
      : null;

    return res.status(200).json({
      body: {
        zoneData: layoutMetadata,
        totalReservation: reservations.length,
        totalCapacity,
        remainingCapacity: totalCapacity - reservations.length,
        checkedInCount,
        demographic: {
          mostParticipatedFaculty: mostParticipatedFaculty
            ? { name: mostParticipatedFaculty, count: departmentCount[mostParticipatedFaculty] }
            : null,
          mostParticipatedYear: mostParticipatedYear
            ? { name: mostParticipatedYear, count: yearCount[mostParticipatedYear] }
            : null,
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /?eventId= — seat map
router.get('/', async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    const all = await listReservations(eventId);
    const privileged = req.user.role === 'admin' || req.user.role === 'organizer';
    const people = privileged ? await fetchUserSummaries(all.map((r) => r.email ?? r.googleId ?? '')) : null;

    const reservations = all.map((r) => {
      const bookerId = r.email ?? r.googleId ?? '';
      const mine = (r.email && r.email === req.user.email) || (r.googleId && r.googleId === req.user.googleId);
      return withSeatParts(people ? { ...r, mine, user: people.get(bookerId) ?? null } : { seatId: r.seatId, mine });
    });

    const found = all.find((r) => (r.email && r.email === req.user.email) || (r.googleId && r.googleId === req.user.googleId));
    const myReservation = found ? withSeatParts(found) : null;

    return res.status(200).json({ body: { reservations, myReservation } });
  } catch (error) {
    const result = bookingErrorResponse(error);
    return res.status(result.status).json(result.body);
  }
});

// POST / — reserve a seat
router.post('/', async (req, res) => {
  const input = readSeatRequest(req.body);
  if (input.error) return res.status(input.status).json(input.body);

  try {
    const ev = await fetchData('events', { eventId: input.eventId });
    if (!ev) return res.status(404).json({ error: 'ไม่พบกิจกรรม' });
    if (!registrationOpen(ev)) return res.status(403).json({ error: 'กิจกรรมนี้ไม่ถูกเปิดให้จองในช่วงเวลานี้' });

    const reservation = await reserveSeat(input.eventId, input.seatId, req.user);
    return res.status(201).json({ body: { message: 'Seat reserved', reservation: withSeatParts(reservation) } });
  } catch (error) {
    const result = bookingErrorResponse(error);
    return res.status(result.status).json(result.body);
  }
});

// DELETE /?eventId=&seatId= — cancel a reservation
router.delete('/', async (req, res) => {
  const { eventId, seatId } = req.query;
  if (!eventId || !isValidSeatId(seatId)) {
    return res.status(400).json({ error: 'eventId and a valid seatId are required' });
  }
  try {
    await cancelSeat(eventId, seatId, req.user);
    return res.status(200).json({ body: { message: 'Reservation cancelled' } });
  } catch (error) {
    const result = bookingErrorResponse(error);
    return res.status(result.status).json(result.body);
  }
});

app.use('/api/booking', router);

export default app;
