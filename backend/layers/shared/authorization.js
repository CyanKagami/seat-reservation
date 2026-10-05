// layers/shared/auth.js
import jwt from 'jsonwebtoken';
import { fetchUser } from './dynamo.js';

export async function verifyAccess(user, intendedRoles) {
  const { googleId } = user;
  const fetchedUser = await fetchUser(googleId);
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

// --- New: Express middleware for reading authorizer context + role gating ---

// Identity + role were already verified by the Lambda authorizer before this
// handler ran — this just reads what the authorizer already put on the request,
// it does not re-verify the token.
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