// src/routes/api/event/getFromId/[eventId]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchEventFromEventId } from '$lib/scripts/server/dynamo';

// GET /api/event/getFromId/:eventId (any logged-in user)
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  try {
    const data = await fetchEventFromEventId(event.params.eventId as string);
    return json({ body: data });
  } catch (error) {
    console.error('Error fetching event:', error);
    return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
  }
};