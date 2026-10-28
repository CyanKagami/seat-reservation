// layers/shared/authorization.js
import jwt from 'jsonwebtoken';
import { fetchUser } from './dynamo.js';

// verifyAccess — live DB check using email as the users hash key.
export async function verifyAccess(user, intendedRoles) {
  const { email } = user;
  const fetchedUser = await fetchUser(email);
  if (!fetchedUser) return false;
  return intendedRoles.includes(fetchedUser.role);
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function signToken(payload, options = { expiresIn: '1d' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

export function extractBearerToken(headers) {
  const authHeader = headers?.authorization || headers?.Authorization || '';
  return authHeader.replace(/^Bearer\s+/i, '');
}

// getUser — reads authorizer context set by the Lambda authorizer,
// with fallback to direct Bearer token verification (for local dev/tests).
export function getUser(req) {
  let ctx = req.requestContext?.authorizer?.lambda ?? req.apiGateway?.event?.requestContext?.authorizer?.lambda;
  if (!ctx || !ctx.email) {
    const token = extractBearerToken(req.headers);
    if (token) {
      try {
        ctx = verifyToken(token);
      } catch (e) {
        ctx = {};
      }
    } else {
      ctx = {};
    }
  }
  return {
    googleId: ctx.googleId || '',
    email: ctx.email || '',
    name: ctx.name || '',
    role: ctx.role || ''
  };
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const tokenUser = getUser(req);
    if (!tokenUser.email) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }

    try {
      const currentUser = await fetchUser(tokenUser.email);
      if (!currentUser) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
      }
      if ((tokenUser.role || '') !== (currentUser.role || '')) {
        return res.status(403).json({
          error: 'สิทธิ์การใช้งานของคุณมีการเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่แล้วลองอีกครั้ง',
          code: 'ROLE_CHANGED'
        });
      }
      if (!currentUser || !allowedRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' });
      }
      req.user = { ...tokenUser, ...currentUser, role: currentUser.role || '' };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function requireAuth(req, res, next) {
  const tokenUser = getUser(req);
  if (!tokenUser.email) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  try {
    const currentUser = await fetchUser(tokenUser.email);
    if (!currentUser) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }
    if ((tokenUser.role || '') !== (currentUser.role || '')) {
      return res.status(403).json({
        error: 'สิทธิ์การใช้งานของคุณมีการเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่แล้วลองอีกครั้ง',
        code: 'ROLE_CHANGED'
      });
    }
    req.user = { ...tokenUser, ...currentUser, role: currentUser.role || '' };
    next();
  } catch (error) {
    next(error);
  }
}
