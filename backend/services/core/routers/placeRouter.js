// services/core/routersRouter.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encode } from '@msgpack/msgpack';
import {
  addFile,
  readFileAsByteArray,
  fetchAllData,
  fetchData,
  addDataUniqueId,
  updateAllAttributes,
  requireRole  // ← now from the layer, not defined locally
} from '/opt/nodejs/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function formatData(data, creator) {
  const location = await fetchData('locations', { locationId: data.location });
  return {
    placeId: data.placeId,
    creatorId: creator.googleId,
    creatorName: creator.name,
    description: data.description,
    name: data.name,
    location
  };
}

// ...rest of the routes unchanged, still use requireRole('admin'), etc.,
// and req.user (set by the middleware) exactly as before

// --- /layout routes registered BEFORE /:placeId ---
// Express matches routes in order, and ':placeId' would otherwise
// swallow the literal path "layout" as if it were an ID.

// GET /layout?placeId=... — fetch the seat layout file
router.get('/layout', requireRole('admin', 'organizer'), async (req, res) => {
  const { placeId } = req.query;
  try {
    const fileContent = await readFileAsByteArray('k-seat-place-layout', `${placeId}.msgpack`);
    res.set({
      'Content-Type': 'application/msgpack',
      'Content-Length': fileContent.byteLength.toString(),
      'Cache-Control': 'no-cache'
    });
    return res.status(200).send(Buffer.from(fileContent));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// PUT /layout — replace the seat layout file
router.put('/layout', requireRole('admin'), upload.single('layoutFile'), async (req, res) => {
  const { placeId } = req.body;
  try {
    const layoutURL = await addFile('k-seat-place-layout', `${placeId}.msgpack`, req.file.buffer);
    await updateAllAttributes('places', { placeId }, { layoutURL });
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET  — list all places
router.get('/', requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const data = await fetchAllData('places');
    return res.status(200).json({ body: { data } });
  } catch (error) {
    console.error('Error fetching places:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST  — create a new place
router.post('/', requireRole('admin'), upload.single('picture'), async (req, res) => {
  try {
    const { name, location: locationId } = req.body;
    const location = await fetchData('locations', { locationId });

    let pictureURL = '';
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      pictureURL = await addFile(
        'k-seat-place-picture',
        `${Date.now()}-${uuidv4()}${ext || ''}`,
        req.file.buffer
      );
    }

    const uniqueId = await addDataUniqueId(
      'places',
      {
        name,
        picture: pictureURL,
        location,
        creatorId: req.user.googleId,
        creatorName: req.user.name
      },
      'placeId'
    );

    const initialLayout = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      canvas: { gridWidth: 80, gridHeight: 80 },
      objects: []
    };
    const msgpack = encode(initialLayout);
    await addFile('k-seat-place-layout', `${uniqueId}.msgpack`, Buffer.from(msgpack));

    return res.status(200).json({ body: { message: 'ok', placeId: uniqueId } });
  } catch (error) {
    console.error('Error creating place:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH  — update an existing place
router.patch('/', requireRole('admin'), upload.single('picture'), async (req, res) => {
  try {
    const data = { ...req.body };
    const processData = {};

    if (req.file) {
      const ext = path.extname(req.file.originalname);
      processData.picture = await addFile(
        'k-seat-place-picture',
        `${data.placeId}${ext || ''}`,
        req.file.buffer
      );
    }
    delete data.picture;

    Object.assign(processData, await formatData(data, req.user));

    await updateAllAttributes('places', { placeId: processData.placeId }, processData);
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error updating place:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:placeId — single place (registered last)
router.get('/:placeId', requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const data = await fetchData('places', { placeId: req.params.placeId });
    return res.status(200).json({ body: { data } });
  } catch (error) {
    console.error('Error fetching place:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;