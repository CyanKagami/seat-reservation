// authorizer.mjs (HTTP API Payload v2)
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const handler = async (event) => {
  const token = event.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return { isAuthorized: false };
  }

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Return success + pass context to downstream Express Lambdas
    return {
      isAuthorized: true,
      context: {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      },
    };
  } catch (err) {
    return { isAuthorized: false };
  }
};