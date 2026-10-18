// src/lib/scripts/guard.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { verifyAccess } from '$lib/scripts/server/authorization';
import type { User } from '$lib/type/user';

/**
 * Verifies the Bearer token and, optionally, the caller's role.
 * Returns the user on success, or a ready-made error Response:
 *
 *   const user = await guard(event, ['admin']);
 *   if (user instanceof Response) return user;
 *
 * roles omitted -> any logged-in user is accepted
 * live: true    -> re-check the role in DynamoDB instead of trusting the role
 *                  inside the JWT (use for actions that grant/revoke access)
 */
export async function guard(
  event: RequestEvent,
  roles?: string[],
  opts: { live?: boolean } = {}
): Promise<User | Response> {
  const token = (event.request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

  let user: User;
  try {
    user = jwt.verify(token, env.JWT_SECRET!) as User;
  } catch {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (roles) {
    const allowed = opts.live ? await verifyAccess(user, roles) : roles.includes(user.role);
    if (!allowed) {
      return json({ error: 'Access denied' }, { status: 403 });
    }
  }

  return user;
}