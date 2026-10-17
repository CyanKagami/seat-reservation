// services/core/routers/eventRouter.js
import { Router } from 'express';
import multer from 'multer';
import { S3ServiceException } from '@aws-sdk/client-s3';
import {
  addFile,
  readFileAsByteArray,
  fetchAllData,
  fetchData,
  addDataUniqueId,
  updateAllAttributes,
  fetchEventFromEventId,
  fetchEventFromHost,
  requireRole,
  requireAuth,
} from '/opt/nodejs/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function formatData(data) {
  const event = { date: {}, 'register-date': {} };

  event.date.start = data.start;
  event.date.end = data.end;
  event['register-date'].start = data['register-date-start'];
  event['register-date'].end = data['register-date-end'];
  event.host = data.host;

  event.name = data.name;
  event.creatorId = data.creatorId;
  event.place = await fetchData('places', { placeId: data.place });
  event.detail = data.detail;
  if (data.timetable) event.timetable = JSON.parse(data.timetable);
  event.condition = data.condition;
  if (data.eventId) event.eventId = data.eventId;

  return event;
}

async function getLayoutFromPlace(eventId, res) {
  const event = await fetchData('events', { eventId });
  if (!event) throw new Error('Event not found');

  const fileContent = await readFileAsByteArray(`layouts/place/${event.place.placeId}.msgpack`);
  res.set({
    'Content-Type': 'application/msgpack',
    'Content-Length': fileContent.byteLength.toString(),
    'Cache-Control': 'no-cache'
  });
  return res.status(200).send(Buffer.from(fileContent));
}

// --- /event/layout and /event/getFromId, /event/getFromHost registered
// before /event itself — none of these collide since they're distinct
// literal path segments, not a ':eventId' catch-all, but kept grouped
// together for clarity.

// GET /event/layout?eventId=... — event-specific layout, falls back to
// the place's default layout if the event hasn't customized one yet
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
      console.error(`S3 Error [${error.name}]: ${error.message}`);
      switch (error.name) {
        case 'NoSuchKey':
          console.error('The requested file does not exist. Falling back to place layout.');
          try {
            return await getLayoutFromPlace(eventId, res);
          } catch (fallbackErr) {
            console.error(fallbackErr);
            return res.status(500).json({ body: { message: 'Internal Server Error' } });
          }
        case 'AccessDenied':
          console.error('Check your IAM permissions or Bucket policies.');
          break;
        default:
          console.error('Other S3 specific issue.');
      }
    }
    console.error(error);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// PUT /event/layout — upload/replace an event-specific layout
router.put('/layout', requireRole('admin'), upload.single('layoutFile'), async (req, res) => {
  const { eventId } = req.body;
  try {
    const layoutURL = await addFile(`layouts/event/${eventId}.msgpack`, req.file.buffer);
    await updateAllAttributes('events', { eventId }, { layoutURL });
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET /event/getFromId/:eventId — public, matches original's actual behavior
// (original extracted a token but never verified it — dead code removed)
router.get('/getFromId/:eventId', requireAuth, async (req, res) => {
  try {
    const data = await fetchEventFromEventId(req.params.eventId);
    return res.status(200).json({ body: data });
  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET /event/getFromHost — events created by the current logged-in user
router.get('/getFromHost', requireAuth, async (req, res) => {
  try {
    const data = await fetchEventFromHost(req.user.googleId);
    return res.status(200).json({ body: data });
  } catch (error) {
    console.error('Error fetching events for host:', error);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET /event — list all events (public, matches original)
router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await fetchAllData('events');
    return res.status(200).json({ body: data });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// POST /event — create an event.
// NOTE: original had no auth check at all — added requireRole here as a fix.
// Remove if this was intentionally meant to be a public endpoint.
router.post('/', requireRole('admin', 'organizer'), upload.single('img'), async (req, res) => {
  try {
    const data = { ...req.body };
    let processData = {};

    if (req.file) {
      processData.picture = await addFile(`pictures/event/${Date.now()}-${uuidv4()}${path.extname(req.file.originalname) || ''}`, req.file.buffer);
    }

    processData = { ...processData, ...(await formatData(data)) };
    await addDataUniqueId('events', processData, 'eventId');

    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// PATCH /event — update an event.
// NOTE: same missing-auth fix as POST above.
router.patch('/', requireRole('admin', 'organizer'), upload.single('img'), async (req, res) => {
  try {
    const data = { ...req.body };
    let processData = {};

    if (req.file) {
      processData.picture = await addFile(`pictures/event/${Date.now()}-${uuidv4()}${path.extname(req.file.originalname) || ''}`, req.file.buffer);
    }

    processData = { ...processData, ...(await formatData(data)) };
    await updateAllAttributes('events', { eventId: processData.eventId }, processData);

    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

export default router;