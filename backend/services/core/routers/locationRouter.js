// services/core/routers/locationRouter.js
import { Router } from 'express';
import { fetchAllData, requireRole } from '/opt/nodejs/index.js';

const router = Router();

// GET /location — list all locations
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const data = await fetchAllData('locations');
    return res.status(200).json({ body: { data } });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;