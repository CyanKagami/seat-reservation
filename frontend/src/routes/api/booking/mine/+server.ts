// src/routes/api/booking/mine/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { listUserReservations } from '$lib/scripts/server/reservation';

// GET /api/booking/mine - the logged-in user's reservations across all events
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  try {
    const reservations = await listUserReservations(user.googleId);
    return json({ body: { reservations } });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};