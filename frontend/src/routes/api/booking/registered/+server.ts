// src/routes/api/booking/registered/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { bookingErrorResponse, getUserSeat } from '$lib/scripts/server/reservation';

// GET /api/booking/registered?eventId=...
// -> { body: { registered: true, seatId, zone, seat } }  or  { body: { registered: false } }
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  try {
    const seat = (await getUserSeat(eventId, user.email)) ?? (user.googleId ? await getUserSeat(eventId, user.googleId) : null);
    return json({ body: seat ? { registered: true, ...seat } : { registered: false } });
  } catch (error) {
    return bookingErrorResponse(error);
  }
};