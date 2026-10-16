// src/routes/api/auth/me/+server.ts
// GET /api/auth/me - return the user decoded from the Bearer token
import { json, type RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = ({ request }) => {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

  if (!token) {
    return json({ body: null }, { status: 401 });
  }

  try {
    const user = jwt.verify(token, env.JWT_SECRET!);
    return json({ body: user });
  } catch {
    return json({ body: null }, { status: 401 });
  }
};