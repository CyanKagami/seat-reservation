import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { encode } from '@msgpack/msgpack';
import { extname } from 'node:path';
import { v4 as uuid } from 'uuid';
import { authenticate, authorize } from './lib/auth.js';
import { addDataUniqueId, fetchAllData, fetchData, fetchEventById, fetchEventsForHost, getFile, paginateReadData, putFile, updateAllAttributes } from './lib/aws.js';

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors({ origin: frontendOrigin || true, credentials: true }));
app.use(express.json());
app.use(express.raw({ type: 'multipart/form-data', limit: '10mb' }));

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sendEnvelope = (res, body, status = 200) => res.status(status).json({ statusCode: status, body });
// Lambda receives browser FormData as a raw multipart buffer. Keep parsing here so
// this service has no filesystem dependency for uploads.
function multipart(fileField) {
  return (req, res, next) => {
    if (!Buffer.isBuffer(req.body)) return next();
    try {
      const boundary = req.get('content-type')?.match(/boundary=([^;]+)/)?.[1]?.replaceAll('"', '');
      if (!boundary) throw new Error('Multipart boundary is missing');
      const marker = Buffer.from(`--${boundary}`);
      const fields = {};
      let file;
      for (let start = req.body.indexOf(marker) + marker.length + 2; start > marker.length + 1;) {
        const end = req.body.indexOf(marker, start);
        if (end < 0) break;
        const part = req.body.subarray(start, end - 2);
        const separator = part.indexOf(Buffer.from('\r\n\r\n'));
        const header = part.subarray(0, separator).toString('utf8');
        const name = header.match(/name="([^"]+)"/)?.[1];
        const filename = header.match(/filename="([^"]*)"/)?.[1];
        const value = part.subarray(separator + 4);
        if (name === fileField && filename) file = { originalname: filename, buffer: value };
        else if (name) fields[name] = value.toString('utf8');
        start = end + marker.length + 2;
      }
      req.body = fields;
      req.file = file;
      next();
    } catch (error) { next(error); }
  };
}

async function eventFromForm(data, file) {
  const event = {
    date: { start: data.start, end: data.end },
    'register-date': { start: data['register-date-start'], end: data['register-date-end'] },
    host: data.host, name: data.name, creatorId: data.creatorId,
    place: await fetchData('places', { placeId: data.place }), detail: data.detail, condition: data.condition
  };
  if (data.timetable) event.timetable = JSON.parse(data.timetable);
  if (data.eventId) event.eventId = data.eventId;
  if (file?.buffer) event.picture = await putFile('k-seat-event-picture', file.originalname, file.buffer);
  return event;
}

app.get('/api/event', authenticate, asyncRoute(async (_req, res) => sendEnvelope(res, await fetchAllData('events'))));
app.get('/api/event/getFromHost', authenticate, asyncRoute(async (req, res) => sendEnvelope(res, await fetchEventsForHost(req.user.googleId))));
app.get('/api/event/getFromId/:eventId', asyncRoute(async (req, res) => sendEnvelope(res, await fetchEventById(req.params.eventId))));
app.post('/api/event', multipart('img'), asyncRoute(async (req, res) => { await addDataUniqueId('events', await eventFromForm(req.body, req.file), 'eventId'); sendEnvelope(res, { message: 'OK' }); }));
app.patch('/api/event', multipart('img'), asyncRoute(async (req, res) => { const event = await eventFromForm(req.body, req.file); await updateAllAttributes('events', { eventId: event.eventId }, event); sendEnvelope(res, { message: 'OK' }); }));
app.get('/api/event/layout', authenticate, authorize('admin', 'organizer'), asyncRoute(async (req, res) => {
  if (!req.query.eventId) return res.sendStatus(400);
  try { res.set({ 'Content-Type': 'application/msgpack', 'Cache-Control': 'no-cache' }).send(await getFile('k-seat-event-layout', `${req.query.eventId}.msgpack`)); }
  catch (error) {
    if (error.name !== 'NoSuchKey') throw error;
    const event = await fetchData('events', { eventId: req.query.eventId });
    res.set({ 'Content-Type': 'application/msgpack', 'Cache-Control': 'no-cache' }).send(await getFile('k-seat-place-layout', `${event.place.placeId}.msgpack`));
  }
}));
app.put('/api/event/layout', authenticate, authorize('admin'), multipart('layoutFile'), asyncRoute(async (req, res) => { const layoutURL = await putFile('k-seat-event-layout', `${req.body.eventId}.msgpack`, req.file.buffer); await updateAllAttributes('events', { eventId: req.body.eventId }, { layoutURL }); sendEnvelope(res, { message: 'OK' }); }));

app.get('/api/place', authenticate, authorize('admin', 'organizer'), asyncRoute(async (_req, res) => sendEnvelope(res, { data: await fetchAllData('places') })));
app.get('/api/place/:placeId', authenticate, authorize('admin', 'organizer'), asyncRoute(async (req, res) => sendEnvelope(res, { data: await fetchData('places', { placeId: req.params.placeId }) })));
app.post('/api/place', authenticate, authorize('admin'), multipart('picture'), asyncRoute(async (req, res) => {
  const picture = req.file ? await putFile('k-seat-place-picture', `${Date.now()}-${uuid()}${extname(req.file.originalname)}`, req.file.buffer) : '';
  const placeId = await addDataUniqueId('places', { name: req.body.name, picture, location: await fetchData('locations', { locationId: req.body.location }), creatorId: req.user.googleId, creatorName: req.user.name }, 'placeId');
  await putFile('k-seat-place-layout', `${placeId}.msgpack`, Buffer.from(encode({ version: '1.0', timestamp: new Date().toISOString(), canvas: { gridWidth: 80, gridHeight: 80 }, objects: [] })));
  sendEnvelope(res, { message: 'ok' });
}));
app.patch('/api/place', authenticate, authorize('admin'), multipart('picture'), asyncRoute(async (req, res) => {
  const changes = { name: req.body.name, description: req.body.description, location: await fetchData('locations', { locationId: req.body.location }), creatorId: req.user.googleId, creatorName: req.user.name };
  if (req.file) changes.picture = await putFile('k-seat-place-picture', `${req.body.placeId}${extname(req.file.originalname)}`, req.file.buffer);
  await updateAllAttributes('places', { placeId: req.body.placeId }, changes); sendEnvelope(res, { message: 'OK' });
}));
app.get('/api/place/layout', authenticate, authorize('admin', 'organizer'), asyncRoute(async (req, res) => res.set({ 'Content-Type': 'application/msgpack', 'Cache-Control': 'no-cache' }).send(await getFile('k-seat-place-layout', `${req.query.placeId}.msgpack`))));
app.put('/api/place/layout', authenticate, authorize('admin'), multipart('layoutFile'), asyncRoute(async (req, res) => { const layoutURL = await putFile('k-seat-place-layout', `${req.body.placeId}.msgpack`, req.file.buffer); await updateAllAttributes('places', { placeId: req.body.placeId }, { layoutURL }); sendEnvelope(res, { message: 'OK' }); }));
app.get('/api/location', authenticate, authorize('admin'), asyncRoute(async (_req, res) => sendEnvelope(res, { data: await fetchAllData('locations') })));

app.get('/api/user', authenticate, authorize('admin'), asyncRoute(async (req, res) => sendEnvelope(res, await paginateReadData('users', 25, req.query.nextToken))));
app.post('/api/user/editRole', authenticate, authorize('admin'), asyncRoute(async (req, res) => { if (!req.query.googleId || !req.query.role) return sendEnvelope(res, { error: 'Missing required parameters' }, 400); const newAttributes = await updateAllAttributes('users', { googleId: req.query.googleId }, { role: req.query.role }); sendEnvelope(res, { message: 'User role updated successfully', newAttributes }); }));

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ statusCode: 500, body: { error: 'Internal server error' } }); });
export default app;
