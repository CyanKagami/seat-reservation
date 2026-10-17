// src/routes/api/auth/logout/+server.ts
// POST /api/auth/logout - JWTs are stateless; the real logout is the client
// deleting its stored token. Kept for symmetry with the frontend call.
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = () => {
  return json({ body: { message: 'Logged out successfully' } });
};