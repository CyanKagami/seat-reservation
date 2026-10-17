import jwt from 'jsonwebtoken';
import { fetchData } from './aws.js';

function tokenFromRequest(req) {
  const cookie = req.get('cookie')?.match(/(?:^|;\s*)user_session=([^;]+)/)?.[1];
  return req.get('authorization')?.replace(/^Bearer\s+/i, '') || (cookie && decodeURIComponent(cookie));
}

export function authenticate(req, res, next) {
  try {
    const token = tokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export function authorize(...roles) {
  return async (req, res, next) => {
    try {
      const user = await fetchData('users', { googleId: req.user.googleId });
      if (!user || !roles.includes(user.role)) return res.status(403).json({ error: 'Access denied' });
      req.currentUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
