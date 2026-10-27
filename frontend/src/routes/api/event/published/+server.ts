// src/routes/api/event/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { updateAllAttributes } from '$lib/scripts/server/dynamo';

// POST /api/event - publish an event
export const POST: RequestHandler = async (event) => {
  const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;
  
  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  try {
    await updateAllAttributes('events', { eventId }, {status:'Published'});
    return json({ body: { message: 'OK' } });
  } catch (error) {
    return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
  }
};

// DELETE /api/event - unpublish an event
export const DELETE: RequestHandler = async (event) => {
  const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;

  const eventId = event.url.searchParams.get('eventId');
  if (!eventId) return json({ error: 'Missing eventId' }, { status: 400 });

  try {
    await updateAllAttributes('events', { eventId }, {status:'Created'});
    return json({ body: { message: 'OK' } });
  } catch (error) {
    return json({ error: 'Internal Server Error'  }, { status: 500 });
  }
};