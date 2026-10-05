import { verifyToken, extractBearerToken } from '/opt/nodejs/index.js';

export const handler = async (event) => {
  const token = extractBearerToken(event.headers);
  if (!token) return { isAuthorized: false };

  try {
    const user = verifyToken(token);
    return { isAuthorized: true, context: { email: user.email, role: user.role, googleId: user.googleId, name: user.name } };
  } catch {
    return { isAuthorized: false };
  }
};