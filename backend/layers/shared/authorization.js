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

// getUser — reads authorizer context set by the Lambda authorizer.
export function getUser(req) {
  const ctx = req.requestContext?.authorizer?.lambda ?? {};
  return {
    googleId: ctx.googleId,
    email: ctx.email,
    name: ctx.name,
    role: ctx.role
  };
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = getUser(req);
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = user;
    next();
  };
}

export function requireAuth(req, res, next) {
  const user = getUser(req);
  if (!user.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  next();
}
