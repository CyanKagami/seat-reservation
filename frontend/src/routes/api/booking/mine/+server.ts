// src/routes/api/booking/mine/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchEventSummaries, listUserReservations, withSeatParts } from '$lib/scripts/server/reservation';

// GET /api/booking/mine - the logged-in user's reservations across events, each with
// zone/seat extracted from seatId and a small `event` summary (null if the event is gone).
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  try {
    const reservations = await listUserReservations(user.email, user.googleId);
    const events = await fetchEventSummaries(reservations.map((r) => r.eventId));

    return json({
      body: reservations.map((r) => withSeatParts({ ...r, event: events.get(r.eventId) ?? null }))
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};