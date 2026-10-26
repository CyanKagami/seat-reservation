import { Router } from 'express';
import { getAllLocations, requireRole } from '/opt/nodejs/index.js';

const router = Router();

// GET /location — list all locations (derived from FACULTY_MAP)
router.get('/', requireRole('admin'), (req, res) => {
  return res.status(200).json({ body: { data: getAllLocations() } });
});

export default router;