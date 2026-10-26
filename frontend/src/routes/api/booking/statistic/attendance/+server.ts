// src/routes/api/booking/registered/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { bookingErrorResponse, getUserSeat, listReservations } from '$lib/scripts/server/reservation';
import { fetchData } from '$lib/scripts/server/dynamo';
import type { Event } from '$lib/type/event';

// GET /api/booking/registered?eventId=...
// -> { body: { registered: true, seatId, zone, seat } }  or  { body: { registered: false } }
export const GET: RequestHandler = async (event) => {
  const user = await guard(event, ['organizer', 'admin']);
  if (user instanceof Response) return user;

  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  try {
    let selectedEvent = await fetchData("events", {eventId:eventId}) as Event | null;
    if (!selectedEvent || (selectedEvent.creatorId !== user.email && user.role !== 'admin')) {
      return json({ error: 'Access denied' }, { status: 403 });
    }
    const all = await listReservations(eventId);
    let checkInCount = all.reduce((p, res) => {return (res.status === 'checked-in') ? p + 1 : p}, 0)
    let totalCount = all.length
    return json({body:{ checkInCount, totalCount}});
  } catch (error) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};