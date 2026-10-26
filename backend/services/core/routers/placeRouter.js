// services/core/routers/placeRouter.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { encode } from '@msgpack/msgpack';
import {
  addFile,
  readFileAsByteArray,
  fetchAllData,
  fetchData,
  addDataUniqueId,
  updateAllAttributes,
  deleteItem,
  deleteFile,
  deleteObjectsWithPrefix,
  getObjectURL,
  requireRole,
  requireAuth,
} from '/opt/nodejs/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function convertToWebp(buffer, quality = 80) {
  return sharp(buffer).webp({ quality }).toBuffer();
}

async function formatData(data, creator) {
  const location = await fetchData('locations', { locationId: data.location });
  return {
    placeId: data.placeId,
    creatorId: creator.email,
    creatorName: creator.name,
    description: data.description,
    name: data.name,
    location
  };
}

// --- /layout routes registered BEFORE /:placeId ---

// GET /layout?placeId= — fetch the seat layout file
router.get('/layout', requireRole('admin', 'organizer'), async (req, res) => {
  const { placeId } = req.query;
  try {
    const fileContent = await readFileAsByteArray(`layouts/place/${placeId}/layout.msgpack`);
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
    const layoutURL = await addFile(`layouts/place/${placeId}`, 'layout.msgpack', req.file.buffer);
    await updateAllAttributes('places', { placeId }, { layoutURL });
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ body: { message: 'Internal Server Error' } });
  }
});

// GET / — list all places
router.get('/', requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const data = await fetchAllData('places');
    return res.status(200).json({ body: { data } });
  } catch (error) {
    console.error('Error fetching places:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — create a new place
router.post('/', requireRole('admin'), upload.single('picture'), async (req, res) => {
  try {
    const { name, location: locationId } = req.body;
    const location = await fetchData('locations', { locationId });
    const picture = req.file;

    const uniqueId = await addDataUniqueId(
      'places',
      {
        name,
        location,
        creatorId: req.user.email,
        creatorName: req.user.name
      },
      'placeId',
      (id) => {
        if (picture) return { picture: getObjectURL('pictures/place', `${id}.webp`) };
        return {};
      }
    );

    if (picture) {
      const converted = await convertToWebp(picture.buffer);
      await addFile('pictures/place', `${uniqueId}.webp`, converted);
    }

    const initialLayout = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      canvas: { gridWidth: 80, gridHeight: 80 },
      objects: []
    };
    await addFile(`layouts/place/${uniqueId}`, 'layout.msgpack', Buffer.from(encode(initialLayout)));

    return res.status(200).json({ body: { message: 'ok', placeId: uniqueId } });
  } catch (error) {
    console.error('Error creating place:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH / — update an existing place
router.patch('/', requireRole('admin'), upload.single('picture'), async (req, res) => {
  try {
    const data = { ...req.body };
    const processData = {};
    const picture = req.file;

    if (picture) {
      const converted = await convertToWebp(picture.buffer);
      processData.picture = await addFile('pictures/place', `${data.placeId}.webp`, converted);
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

// DELETE /?placeId= — delete a place and its assets
router.delete('/', requireRole('admin'), async (req, res) => {
  const { placeId } = req.query;
  if (!placeId) return res.status(400).json({ error: 'Missing placeId' });
  try {
    await deleteItem('places', { placeId });
    await deleteFile('pictures/place', `${placeId}.webp`).catch(() => {});
    await deleteObjectsWithPrefix(`layouts/place/${placeId}`);
    return res.status(200).json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error deleting place:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
