// src/routes/api/event/layout/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { guard } from '$lib/scripts/server/guard';
import { addFile, readFileAsByteArray } from '$lib/scripts/server/s3';
import { fetchData, updateAllAttributes } from '$lib/scripts/server/dynamo';
import type { Event } from '$lib/type/event';

function msgpackResponse(content: Uint8Array) {
  return new Response(content as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/msgpack',
      'Content-Length': content.byteLength.toString(),
      'Cache-Control': 'no-cache'
    }
  });
}

// If an event has no custom layout yet, fall back to its place's layout.
async function getLayoutFromPlace(eventId: string) {
  const ev = (await fetchData('events', { eventId })) as Event | null;
  if (!ev) throw new Error('Event not found');
  return readFileAsByteArray(`layouts/place`, `${ev.place.placeId}.msgpack`);
}

// GET /api/event/layout?eventId=...
export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['admin', 'organizer']);
    if (user instanceof Response) return user;

    const eventId = event.url.searchParams.get('eventId');
    if (!eventId) return new Response(null, { status: 400 });

    try {
        return msgpackResponse(await readFileAsByteArray(`layouts/event`, `${eventId}.msgpack`));
    } catch (error) {
        if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
        try {
            return msgpackResponse(await getLayoutFromPlace(eventId));
        } catch (fallbackErr) {
            console.error(fallbackErr);
        }
        } else {
        console.error(error);
        }
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
};

// PUT /api/event/layout - save an event-specific layout
export const PUT: RequestHandler = async (event) => {
    const user = await guard(event, ['admin']);
    if (user instanceof Response) return user;

    const form = await event.request.formData();
    const eventId = form.get('eventId') as string | null;
    const layoutFile = form.get('layoutFile') as File | null;
    if (!eventId || !layoutFile) {
        return json({ error: 'Missing eventId or layoutFile' }, { status: 400 });
    }

    try {
        const fileBuffer = Buffer.from(await layoutFile.arrayBuffer());
        const layoutURL = await addFile(`layouts/event`,`${eventId}.msgpack`, fileBuffer);
        await updateAllAttributes('events', { eventId }, { layoutURL });
        return json({ body: { message: 'OK' } });
    } catch (err) {
        console.error(err);
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
};