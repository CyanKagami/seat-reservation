// services/core/routers/userRouter.js
import { Router } from 'express';
import {
  paginateReadData,
  updateAllAttributes,
  requireRole,
  verifyAccess
} from '/opt/nodejs/index.js';

const router = Router();

const VALID_ROLES = ['admin', 'organizer', 'guest']; // adjust to match your actual role set

// GET /user — paginated list of all users
router.get('/user', requireRole('admin'), async (req, res) => {
  const page = req.query.nextToken || undefined;
  try {
    const { items, nextToken } = await paginateReadData('users', 25, page);
    return res.status(200).json({ body: { items, nextToken } });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /editRole — change another user's role.
// Uses a live DB check (verifyAccess) rather than the JWT's embedded role:
// role changes should take effect immediately, and this specifically prevents
// a just-demoted admin from using their still-valid JWT to re-promote themselves
// before it expires.
router.post('/editRole', async (req, res) => {
  const { googleId: requesterId } = req.user ?? {};
  const requesterUser = { googleId: req.requestContext?.authorizer?.lambda?.googleId };

  if (!(await verifyAccess(requesterUser, ['admin']))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { googleId, role } = req.query;

  if (!googleId || !role) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  if (googleId === req.requestContext?.authorizer?.lambda?.googleId && role !== 'admin') {
    return res.status(400).json({ error: "Cannot change your own role away from admin" });
    }

  try {
    const newAttributes = await updateAllAttributes('users', { googleId }, { googleId, role });
    console.log(newAttributes);
    return res.status(200).json({ body: { message: 'User role updated successfully', newAttributes } });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;