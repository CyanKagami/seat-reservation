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
  isEventCheckInDay,
  FACULTY_MAP,
  requestLogger,
  requestLogContext,
  logError,
  normalizeJsonApiResponse,
} from '/opt/nodejs/index.js';

const app = express();
const allowedOrigins = [process.env.FRONTEND_ORIGIN, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(requestLogger('booking'));
app.use(normalizeJsonApiResponse);
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

function parseKmitlEmail(email) {
  if (typeof email !== 'string') return { isValid: false, error: 'ข้อมูลต้องเป็นข้อความ' };
  const regex = /^(\d{2})(\d{2})(\d{4})@kmitl\.ac\.th$/i;
  const match = email.trim().match(regex);
  if (!match) return { isValid: false, error: 'รูปแบบอีเมลนักศึกษาไม่ถูกต้อง' };
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
    if (!isEventCheckInDay(ev)) {
      return res.status(403).json({ error: 'เช็กชื่อได้เฉพาะวันที่จัดกิจกรรม' });
    }

    const reservation = await (input.identifierType === 'SeatId'
      ? checkInWithSeatId(ev.eventId, input.identifier)
      : checkInWithStudentId(ev.eventId, input.identifier));

    return res.status(201).json({ body: { message: 'เช็คชื่อสำเร็จ', reservation: withSeatParts(reservation) } });
  } catch (error) {
    const result = checkInErrorResponse(error, requestLogContext(req, { eventId: input.eventId }));
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
    logError('Failed to fetch user reservations', error, requestLogContext(req));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// GET /registered/me?eventId=
router.get('/registered/me', async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรม' });
  try {
    let seat = await getUserSeat(eventId, req.user.email);
    if (!seat && req.user.googleId) seat = await getUserSeat(eventId, req.user.googleId);
    return res.status(200).json({ body: seat ? { registered: true, ...seat } : { registered: false } });
  } catch (error) {
    const result = checkInErrorResponse(error, requestLogContext(req, { eventId }));
    return res.status(result.status).json(result.body);
  }
});

// GET /registered?eventId=&identifier=
router.get('/registered', requireRole('organizer', 'admin'), async (req, res) => {
  const { eventId, identifier } = req.query;
  if (!eventId) return res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรม' });
  if (!identifier) return res.status(400).json({ error: 'กรุณาระบุข้อมูลสำหรับค้นหา' });

  try {
    const selectedEvent = await fetchData('events', { eventId });
    if (!selectedEvent || (selectedEvent.creatorId !== req.user.email && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' });
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

    return res.status(400).json({ error: 'รูปแบบข้อมูลสำหรับค้นหาไม่ถูกต้อง', code: 'BAD_REQUEST' });
  } catch (error) {
    logError('Failed to fetch registered seat', error, requestLogContext(req, { eventId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// GET /statistic/attendance?eventId=
router.get('/statistic/attendance', requireRole('organizer', 'admin'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรม' });
  try {
    const selectedEvent = await fetchData('events', { eventId });
    if (!selectedEvent || (selectedEvent.creatorId !== req.user.email && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' });
    }
    const all = await listReservations(eventId);
    const checkInCount = all.reduce((p, r) => (r.status === 'checked-in' ? p + 1 : p), 0);
    const totalCount = all.length;
    return res.status(200).json({ body: { checkInCount, totalCount } });
  } catch (error) {
    logError('Failed to fetch attendance statistics', error, requestLogContext(req, { eventId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// GET /statistic/seating?eventId=
router.get('/statistic/seating', requireRole('organizer', 'admin'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรม' });
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
    logError('Failed to fetch seating statistics', error, requestLogContext(req, { eventId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// GET /?eventId= — seat map
router.get('/', async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรม' });
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
    const result = bookingErrorResponse(error, requestLogContext(req));
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
    return res.status(201).json({ body: { message: 'จองที่นั่งสำเร็จ', reservation: withSeatParts(reservation) } });
  } catch (error) {
    const result = bookingErrorResponse(error, requestLogContext(req, { eventId: input.eventId }));
    return res.status(result.status).json(result.body);
  }
});

// DELETE /?eventId=&seatId= — cancel a reservation
router.delete('/', async (req, res) => {
  const { eventId, seatId } = req.query;
  if (!eventId || !isValidSeatId(seatId)) {
    return res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรมและรหัสที่นั่งที่ถูกต้อง' });
  }
  try {
    await cancelSeat(eventId, seatId, req.user);
    return res.status(200).json({ body: { message: 'ยกเลิกการจองสำเร็จ' } });
  } catch (error) {
    const result = bookingErrorResponse(error, requestLogContext(req, { eventId }));
    return res.status(result.status).json(result.body);
  }
});

app.use('/api/booking', router);
app.use((req, res) => {
  res.status(404).json({ error: 'ไม่พบเส้นทาง API ที่ร้องขอ' });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) && error.status >= 400 ? error.status : 500;
  if (status >= 500) {
    logError('Unhandled booking API error', error, requestLogContext(req));
  }
  return res.status(status).json({
    error: status >= 500 ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' : 'คำขอไม่ถูกต้อง'
  });
});

export default app;
