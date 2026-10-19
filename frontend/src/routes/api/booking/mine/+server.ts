// src/routes/api/booking/mine/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchEventSummaries, listUserReservations } from '$lib/scripts/server/reservation';

// GET /api/booking/mine - the logged-in user's reservations across events,
// each with a small `event` summary (null if the event no longer exists).
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;
 
  try {
    const reservations = await listUserReservations(user.googleId);
    const events = await fetchEventSummaries(reservations.map((r) => r.eventId));
 
    return json({
      body: {
        reservations: reservations.map((r) => ({ ...r, event: events.get(r.eventId) ?? null }))
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
 