// services/core/routers/userRouter.js
import { Router } from 'express';
import {
  paginateReadData,
  updateAllAttributes,
  requireRole,
  requireAuth,
  verifyAccess
} from '/opt/nodejs/index.js';

const router = Router();

const VALID_ROLES = ['admin', 'organizer', 'guest'];

// GET / — paginated list of all users
router.get('/', requireRole('admin'), async (req, res) => {
  const page = req.query.nextToken || undefined;
  try {
    const { items, nextToken } = await paginateReadData('users', 25, page);
    return res.status(200).json({ body: { items, nextToken } });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /editRole?email=&role= — change another user's role.
// Uses a live DB check (verifyAccess) so role changes take effect immediately.
router.post('/editRole', requireAuth, async (req, res) => {
  if (!(await verifyAccess({ email: req.user.email }, ['admin']))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { email, role } = req.query;

  if (!email || !role) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (email === req.user.email && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change your own role away from admin' });
  }

  try {
    const newAttributes = await updateAllAttributes('users', { email }, { role });
    return res.status(200).json({ body: { message: 'User role updated successfully', newAttributes } });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
