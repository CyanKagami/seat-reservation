// src/routes/api/booking/registered/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { bookingErrorResponse, checkInErrorResponse, fetchEventSummaries, getUserSeat, SLOT_PREFIX, withSeatParts } from '$lib/scripts/server/reservation';
import { fetchData } from '$lib/scripts/server/dynamo';
import type { Event } from '$lib/type/event';
import { classifyIdentifier } from '$lib/scripts/checkIn';
import type { Reservation } from '$lib/type/reservation';

// GET /api/booking/registered?eventId=...
// -> { body: { registered: true, seatId, zone, seat } }  or  { body: { registered: false } }
export const GET: RequestHandler = async (event) => {
  const user = await guard(event, ['organizer', 'admin']);
  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  const identifier = event.url.searchParams.get('identifier');
  if (!identifier) return json({ error: 'Missing identifier' }, { status: 400 });
  
  if (user instanceof Response) return user;
  let selectedEvent = await fetchData("events", { eventId: eventId }) as Event | null;
  if (!selectedEvent || (selectedEvent.creatorId !== user.email && user.role !== 'admin')) {
    return json({ error: 'Access denied' }, { status: 403 });
  }

  let result = classifyIdentifier(identifier)
  if (result.type === "StudentId") {
    let reservation = await fetchData('reservations', { eventId: eventId, seatId: SLOT_PREFIX + result.value + "@kmitl.ac.th" }) as Reservation;
    reservation = await fetchData('reservations', { eventId: eventId, seatId: reservation.reservedSeatId }) as Reservation;
    let seat = withSeatParts(reservation);
    return json({ body: seat })
  }
  else if (result.type === "SeatId") {
    let reservation = await fetchData('reservations', { eventId: eventId, seatId: result.value }) as Reservation;
    let seat = withSeatParts(reservation);
    return json({ body: seat })
  }

  return json({ error: 'Malformed Identifier', code: 'BAD_REQUEST' }, { status: 400 });
};