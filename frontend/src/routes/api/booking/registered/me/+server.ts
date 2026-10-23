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


  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });
  const user = await guard(event);
  if (user instanceof Response) return user;
  try {
    const seat = (await getUserSeat(eventId, user.email)) ?? (user.googleId ? await getUserSeat(eventId, user.googleId) : null);
    return json({ body: seat ? { registered: true, ...seat } : { registered: false } });
  } catch (error) {
    return checkInErrorResponse(error);
  }
};