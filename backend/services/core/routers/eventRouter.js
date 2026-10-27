// services/core/routers/eventRouter.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { S3ServiceException } from '@aws-sdk/client-s3';
import {
  addFile,
  readFileAsByteArray,
  fetchAllData,
  fetchData,
  addDataUniqueId,
  updateAllAttributes,
  deleteItem,
  deleteFile,
  fetchEventFromEventId,
  fetchEventFromHost,
  requireRole,
  requireAuth,
  logError,
  requestLogContext,
} from '/opt/nodejs/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function convertToWebp(buffer, quality = 80) {
  return sharp(buffer).webp({ quality }).toBuffer();
}

async function readPlaceLayout(placeId) {
  try {
    return await readFileAsByteArray(`layouts/place/${placeId}/layout.msgpack`);
  } catch (error) {
    if (!(error instanceof S3ServiceException) || error.name !== 'NoSuchKey') throw error;
  }

  try {
    return await readFileAsByteArray(`layouts/place/${placeId}.msgpack`);
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') return null;
    throw error;
  }
}

async function formatData(data, creatorId) {
  const event = {};

  if (data.start || data.end) {
    event.date = {};
    if (data.start) event.date.start = data.start;
    if (data.end) event.date.end = data.end;
  }
  if (data['register-date-start'] || data['register-date-end']) {
    event['register-date'] = {};
    if (data['register-date-start']) event['register-date'].start = data['register-date-start'];
    if (data['register-date-end']) event['register-date'].end = data['register-date-end'];
  }
  if (data.host !== undefined) event.host = data.host;
  if (data.name !== undefined) event.name = data.name;
  if (creatorId) event.creatorId = creatorId;
  else if (data.creatorId) event.creatorId = data.creatorId;

  if (data.place) {
    const placeId = typeof data.place === 'object' ? data.place.placeId : data.place;
    event.place = await fetchData('places', { placeId });
  }
  if (data.detail !== undefined) event.detail = data.detail;
  if (data.timetable) {
    try {
      event.timetable = typeof data.timetable === 'string' ? JSON.parse(data.timetable) : data.timetable;
    } catch {
      event.timetable = data.timetable;
    }
  }
  if (data.condition !== undefined) event.condition = data.condition;
  if (data.eventId) event.eventId = data.eventId;

  return event;
}

async function getLayoutFromPlace(eventId, res) {
  const event = await fetchData('events', { eventId });
  if (!event) throw new Error('Event not found');

  const placeId = event.place?.placeId || event.place;
  let fileContent;
  try {
    fileContent = await readFileAsByteArray(`layouts/place/${placeId}/layout.msgpack`);
  } catch {
    fileContent = await readFileAsByteArray(`layouts/place/${placeId}.msgpack`);
  }
  res.set({
    'Content-Type': 'application/msgpack',
    'Content-Length': fileContent.byteLength.toString(),
    'Cache-Control': 'no-cache'
  });
  return res.status(200).send(Buffer.from(fileContent));
}

// --- /published routes must be registered BEFORE generic routes ---

// POST /event/published?eventId= — publish an event
router.post('/published', requireRole('admin', 'organizer'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    await updateAllAttributes('events', { eventId }, { status: 'Published' });
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (err) {
    logError('Failed to publish event', err, requestLogContext(req, { eventId }));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// DELETE /event/published?eventId= — unpublish an event
router.delete('/published', requireRole('admin', 'organizer'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    await updateAllAttributes('events', { eventId }, { status: 'Created' });
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (err) {
    logError('Failed to unpublish event', err, requestLogContext(req, { eventId }));
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /event/layout?eventId= — event-specific layout, falls back to place layout
router.get('/layout', requireRole('admin', 'organizer'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).send();

  try {
    const fileContent = await readFileAsByteArray(`layouts/event/${eventId}.msgpack`);
    res.set({
      'Content-Type': 'application/msgpack',
      'Content-Length': fileContent.byteLength.toString(),
      'Cache-Control': 'no-cache'
    });
    return res.status(200).send(Buffer.from(fileContent));
  } catch (error) {
    if (error instanceof S3ServiceException) {
      if (error.name === 'NoSuchKey') {
        try {
          return await getLayoutFromPlace(eventId, res);
        } catch (fallbackErr) {
          logError('Failed to load event layout from its place', fallbackErr, requestLogContext(req, { eventId }));
          return res.status(500).json({ body: { message: 'Internal Server Error' } });
        }
      }
    }
    logError('Failed to load event layout', error, requestLogContext(req, { eventId }));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// PUT /event/layout — upload/replace an event-specific layout
router.put('/layout', requireRole('admin'), upload.single('layoutFile'), async (req, res) => {
  const { eventId } = req.body;
  try {
    const layoutURL = await addFile('layouts/event', `${eventId}.msgpack`, req.file.buffer);
    await updateAllAttributes('events', { eventId }, { layoutURL });
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (err) {
    logError('Failed to save event layout', err, requestLogContext(req, { eventId }));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET /event/getFromId/:eventId
router.get('/getFromId/:eventId', requireAuth, async (req, res) => {
  try {
    const data = await fetchEventFromEventId(req.params.eventId);
    return res.status(200).json({ body: data });
  } catch (error) {
    logError('Failed to fetch event', error, requestLogContext(req, { eventId: req.params.eventId }));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET /event/getFromHost — events created by the current user
router.get('/getFromHost', requireAuth, async (req, res) => {
  try {
    const data = await fetchEventFromHost(req.user.email);
    return res.status(200).json({ body: data });
  } catch (error) {
    logError('Failed to fetch events for host', error, requestLogContext(req));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET /event — list published events
router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await fetchAllData('events', { status: 'Published' });
    return res.status(200).json({ body: data });
  } catch (error) {
    logError('Failed to fetch published events', error, requestLogContext(req));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// POST /event — create an event
router.post('/', requireRole('admin', 'organizer'), upload.single('img'), async (req, res) => {
  try {
    const data = { ...req.body };
    const processData = { ...(await formatData(data, req.user.email)), status: 'Created' };
    const placeId = processData.place?.placeId || processData.place;
    const placeLayout = placeId ? await readPlaceLayout(placeId) : null;

    const eventId = await addDataUniqueId('events', processData, 'eventId');

    if (req.file) {
      const converted = await convertToWebp(req.file.buffer);
      const pictureURL = await addFile('pictures/event', `${eventId}.webp`, converted);
      await updateAllAttributes('events', { eventId }, { picture: pictureURL });
    }
    if (placeLayout) {
      const layoutURL = await addFile('layouts/event', `${eventId}.msgpack`, Buffer.from(placeLayout));
      await updateAllAttributes('events', { eventId }, { layoutURL });
    }

    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    logError('Failed to create event', error, requestLogContext(req));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// PATCH /event — update an event
router.patch('/', requireRole('admin', 'organizer'), upload.single('img'), async (req, res) => {
  try {
    const data = { ...req.body };
    const processData = await formatData(data);

    if (req.file) {
      const converted = await convertToWebp(req.file.buffer);
      const pictureURL = await addFile('pictures/event', `${processData.eventId}.webp`, converted);
      processData.picture = pictureURL;
    }

    await updateAllAttributes('events', { eventId: processData.eventId }, processData);
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    logError('Failed to update event', error, requestLogContext(req, { eventId: req.body?.eventId }));
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// DELETE /event?eventId= — delete an event
router.delete('/', requireRole('admin', 'organizer'), async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  try {
    await deleteItem('events', { eventId });
    await Promise.all([
      deleteFile('pictures/event', `${eventId}.webp`),
      deleteFile('pictures/event', eventId)
    ]).catch(() => {}); // Keep deleting events that have no image or a legacy image.
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    logError('Failed to delete event', error, requestLogContext(req, { eventId }));
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
