// services/core/routers/placeRouter.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { decode, encode } from '@msgpack/msgpack';
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
  getLocation,
  requireRole,
  requireAuth,
  logError,
  logWarn,
  requestLogContext,
} from '/opt/nodejs/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function convertToWebp(buffer, quality = 80) {
  return sharp(buffer).webp({ quality }).toBuffer();
}

function isValidDataUrl(str) {
  return typeof str === 'string' && /^data:(.+?);base64,(.+)$/.test(str);
}

function parseDataUrl(dataUrl) {
  const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!matches) throw new Error('Invalid Data URL format');
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
}

async function formatData(data, creator) {
  const result = {};
  if (data.placeId) result.placeId = data.placeId;
  if (creator) {
    if (creator.email) result.creatorId = creator.email;
    if (creator.name) result.creatorName = creator.name;
  }
  if (data.description !== undefined) result.description = data.description;
  if (data.name !== undefined) result.name = data.name;
  if (data.location) {
    result.location = getLocation(data.location);
  }
  return result;
}

// --- /layout routes registered BEFORE /:placeId ---

// GET /layout?placeId= — fetch the seat layout file
router.get('/layout', requireRole('admin', 'organizer'), async (req, res) => {
  const { placeId } = req.query;
  if (!placeId) return res.status(400).send();
  try {
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
  } catch (err) {
    logError('Failed to load place layout', err, requestLogContext(req, { placeId }));
    return res.status(500).json({ error: 'ไม่สามารถโหลดแผนผังที่นั่งได้' });
  }
});

// PUT /layout — replace the seat layout file (extracts any data URL images in seatTypes)
router.put('/layout', requireRole('admin'), upload.single('layoutFile'), async (req, res) => {
  const { placeId } = req.body;
  if (!placeId || !req.file) {
    return res.status(400).json({ error: 'กรุณาระบุรหัสสถานที่และไฟล์แผนผังที่นั่ง' });
  }
  try {
    let layoutBuffer = req.file.buffer;
    try {
      const seatmap = decode(layoutBuffer);
      if (seatmap && seatmap.seatTypes) {
        const seatTypes = Object.values(seatmap.seatTypes);
        const keepKeys = new Set(
          seatTypes
            .filter((v) => v.picture && !isValidDataUrl(v.picture))
            .map((v) => `layouts/place/${placeId}/${v.name}.webp`)
        );
        await deleteObjectsWithPrefix(`layouts/place/${placeId}`, keepKeys);

        for (const value of seatTypes) {
          if (!value.picture || !isValidDataUrl(value.picture)) continue;
          try {
            const parsed = parseDataUrl(value.picture);
            const convertedImg = await convertToWebp(parsed.buffer, 80);
            const imgURL = await addFile(`layouts/place/${placeId}`, `${value.name}.webp`, convertedImg);
            seatmap.seatTypes[value.name].picture = imgURL;
          } catch (err) {
            logError('Failed to convert seat type image', err, requestLogContext(req, {
              placeId,
              seatType: value.name
            }));
          }
        }
        layoutBuffer = Buffer.from(encode(seatmap));
      }
    } catch (decodeErr) {
      logWarn('Layout could not be decoded as MessagePack; uploading original buffer', {
        requestId: req.requestId,
        placeId,
        errorName: decodeErr?.name,
        errorMessage: decodeErr?.message
      });
    }

    const layoutURL = await addFile(`layouts/place/${placeId}`, 'layout.msgpack', layoutBuffer);
    await updateAllAttributes('places', { placeId }, { layoutURL });
    return res.status(200).json({ body: { message: 'บันทึกแผนผังที่นั่งสำเร็จ' } });
  } catch (err) {
    logError('Failed to save place layout', err, requestLogContext(req, { placeId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// GET / — list all places
router.get('/', requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const data = await fetchAllData('places');
    return res.status(200).json({ body: { data } });
  } catch (error) {
    logError('Failed to fetch places', error, requestLogContext(req));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// POST / — create a new place
router.post('/', requireRole('admin'), upload.single('picture'), async (req, res) => {
  try {
    const { name, location: locationId } = req.body;
    const location = getLocation(locationId);
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

    return res.status(200).json({ body: { message: 'สร้างสถานที่สำเร็จ', placeId: uniqueId } });
  } catch (error) {
    logError('Failed to create place', error, requestLogContext(req));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
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
    return res.status(200).json({ body: { message: 'บันทึกข้อมูลสถานที่สำเร็จ' } });
  } catch (error) {
    logError('Failed to update place', error, requestLogContext(req, { placeId: req.body?.placeId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// DELETE /?placeId= — delete a place and its assets
router.delete('/', requireRole('admin'), async (req, res) => {
  const { placeId } = req.query;
  if (!placeId) return res.status(400).json({ error: 'กรุณาระบุรหัสสถานที่' });
  try {
    await deleteItem('places', { placeId });
    await deleteFile('pictures/place', `${placeId}.webp`).catch(() => {});
    await deleteObjectsWithPrefix(`layouts/place/${placeId}`);
    return res.status(200).json({ body: { message: 'ลบสถานที่สำเร็จ' } });
  } catch (error) {
    logError('Failed to delete place', error, requestLogContext(req, { placeId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

// GET /:placeId — single place (registered last)
router.get('/:placeId', requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const data = await fetchData('places', { placeId: req.params.placeId });
    return res.status(200).json({ body: { data } });
  } catch (error) {
    logError('Failed to fetch place', error, requestLogContext(req, { placeId: req.params.placeId }));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

export default router;
