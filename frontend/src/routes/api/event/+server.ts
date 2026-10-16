// src/routes/api/event/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/guard';
import { addFile } from '$lib/scripts/s3';
import { addDataUniqueId, fetchAllData, fetchData, updateAllAttributes } from '$lib/scripts/dynamo';
import type { Event } from '$lib/type/event';
import type { Place } from '$lib/type/place';

interface EventFormData {
  name: string;
  place: string;
  detail: string;
  condition: string;
  start: string;
  end: string;
  'register-date-start': string;
  'register-date-end': string;
  img?: File;
  timetable?: string;
  host: string;
  eventId?: string;
}

// creatorId is passed in by the server (from the verified token) on create;
// it is never taken from the form, so a client can't claim someone else's events.
async function formatData(data: EventFormData, creatorId?: string) {
  const result = { date: {}, 'register-date': {} } as Event;

  result.date.start = data.start;
  result.date.end = data.end;
  result['register-date'].start = data['register-date-start'];
  result['register-date'].end = data['register-date-end'];
  result.host = data.host;

  result.name = data.name;
  if (creatorId) result.creatorId = creatorId;
  result.place = (await fetchData('places', { placeId: data.place })) as Place;
  result.detail = data.detail;
  if (data.timetable) result.timetable = JSON.parse(data.timetable);
  result.condition = data.condition;
  if (data.eventId) result.eventId = data.eventId;

  return result;
}

// GET /api/event - list all events (any logged-in user)
export const GET: RequestHandler = async (event) => {
  const user = await guard(event);
  if (user instanceof Response) return user;

  try {
    const data = await fetchAllData('events');
    return json({ body: data });
  } catch (error) {
    console.error('Error fetching events:', error);
    return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
  }
};

// POST /api/event - create an event
export const POST: RequestHandler = async (event) => {
  const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;

  try {
    const data = Object.fromEntries(await event.request.formData()) as unknown as EventFormData;
    let processData = {} as Event;

    const img = data.img;
    if (img && img.size > 0) {
      const buffer = Buffer.from(await img.arrayBuffer());
      processData.picture = await addFile(`pictures/event`,`${Date.now()}-${img.name}`, buffer);
    }
    delete data.img;

    processData = { ...processData, ...(await formatData(data, user.googleId)) };
    await addDataUniqueId('events', processData, 'eventId');

    return json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error creating event:', error);
    return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
  }
};

// PATCH /api/event - update an event
export const PATCH: RequestHandler = async (event) => {
  const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;

  try {
    const data = Object.fromEntries(await event.request.formData()) as unknown as EventFormData;
    if (!data.eventId) {
      return json({ error: 'Missing eventId' }, { status: 400 });
    }
    let processData = {} as Event;

    const img = data.img;
    if (img && img.size > 0) {
      const buffer = Buffer.from(await img.arrayBuffer());
      processData.picture = await addFile(`pictures/event`,`${Date.now()}-${img.name}`, buffer);
    }
    delete data.img;

    // no creatorId here: editing must not change who owns the event
    processData = { ...processData, ...(await formatData(data)) };
    await updateAllAttributes('events', { eventId: processData.eventId }, processData);

    return json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error updating event:', error);
    return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
  }
};