// services/core/routers/userRouter.js
import { Router } from 'express';
import {
  paginateReadData,
  updateAllAttributes,
  requireRole,
  requireAuth,
  verifyAccess,
  logError,
  requestLogContext
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
    logError('Failed to fetch users', error, requestLogContext(req));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /editRole?email=&role= — change another user's role.
// Uses a live DB check (verifyAccess) so role changes take effect immediately.
router.post('/editRole', requireAuth, async (req, res) => {
  if (!(await verifyAccess({ email: req.user.email }, ['admin']))) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' });
  }

  const { email, role } = req.query;

  if (!email || !role) {
    return res.status(400).json({ error: 'กรุณาระบุอีเมลและบทบาทที่ต้องการ' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `บทบาทไม่ถูกต้อง โดยต้องเป็นหนึ่งใน: ${VALID_ROLES.join(', ')}` });
  }
  if (email === req.user.email && role !== 'admin') {
    return res.status(400).json({ error: 'ไม่สามารถเปลี่ยนบทบาทบัญชีของตนเองจากผู้ดูแลระบบเป็นบทบาทอื่นได้' });
  }

  try {
    const newAttributes = await updateAllAttributes('users', { email }, { role });
    return res.status(200).json({ body: { message: 'เปลี่ยนบทบาทผู้ใช้เรียบร้อยแล้ว', updatedUser: newAttributes, newAttributes } });
  } catch (error) {
    logError('Failed to update user role', error, requestLogContext(req));
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
  }
});

router.use('/editRole', (error, req, res, next) => {
  if (res.headersSent) return next(error);
  logError('Unexpected error while handling editRole request', error, requestLogContext(req));
  return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' });
});

export default router;
