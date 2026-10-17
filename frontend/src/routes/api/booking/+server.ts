// src/routes/api/booking/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/guard';
import { fetchData } from '$lib/scripts/dynamo';
import {
  bookingErrorResponse,
  cancelSeat,
  fetchUserSummaries,
  isValidSeatId,
  listReservations,
  readSeatRequest,
  reserveSeat
} from '$lib/scripts/reservation';
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

// GET /api/booking?eventId=...  - seat map data for one event (reserved seats only).
// Everyone gets { seatId, mine }; admin/organizer also get the full record
// (status, googleId, reservedAt) plus the booker's name and email.
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  try {
    const all = await listReservations(eventId);
    const privileged = user.role === 'admin' || user.role === 'organizer';
    const people = privileged ? await fetchUserSummaries(all.map((r) => r.googleId)) : null;

    const reservations = all.map((r) => {
      const mine = r.googleId === user.googleId;
      return people ? { ...r, mine, user: people.get(r.googleId) ?? null } : { seatId: r.seatId, mine };
    });
    const myReservation = all.find((r) => r.googleId === user.googleId) ?? null;

    return json({ body: { reservations, myReservation } });
  } catch (error) {
    return bookingErrorResponse(error);
  }
};

// POST /api/booking  { eventId, seatId } - reserve a seat
export const POST: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  const input = await readSeatRequest(event.request);
  if (input instanceof Response) return input;

  try {
    const ev = (await fetchData('events', { eventId: input.eventId })) as Event | null;
    if (!ev) return json({ error: 'Event not found' }, { status: 404 });

    if (!registrationOpen(ev)) {
      return json({ error: 'Registration is not open for this event' }, { status: 403 });
    }

    const reservation = await reserveSeat(input.eventId, input.seatId, user);
    return json({ body: { message: 'Seat reserved', reservation } }, { status: 201 });
  } catch (error) {
    return bookingErrorResponse(error);
  }
};

// DELETE /api/booking?eventId=...&seatId=... - cancel (own seat, or any seat for admin)
export const DELETE: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  const eventId = event.url.searchParams.get('eventId');
  const seatId = event.url.searchParams.get('seatId');
  if (!eventId || !isValidSeatId(seatId)) {
    return json({ error: 'eventId and a valid seatId are required' }, { status: 400 });
  }

  try {
    await cancelSeat(eventId, seatId, user);
    return json({ body: { message: 'Reservation cancelled' } });
  } catch (error) {
    return bookingErrorResponse(error);
  }
};