// src/routes/api/auth/me/+server.ts
// GET /api/auth/me - return the user decoded from the Bearer token
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';

export const GET: RequestHandler = async (event) => {
  const user = await guard(event, undefined, { live: true, allowRoleChange: true });
  if (user instanceof Response) return json({ body: null }, { status: user.status });
  return json({ body: user });
};