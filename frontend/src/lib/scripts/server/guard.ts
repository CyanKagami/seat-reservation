// src/lib/scripts/guard.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { fetchUser } from '$lib/scripts/server/dynamo';
import type { User } from '$lib/type/user';

/**
 * Verifies the Bearer token and, optionally, the caller's role.
 * Returns the user on success, or a ready-made error Response:
 *
 *   const user = await guard(event, ['admin']);
 *   if (user instanceof Response) return user;
 *
 * roles provided -> load the current user from DynamoDB and check their current role
 * live: true      -> also refresh user data for identity-only routes with role-based behavior
 */
export async function guard(
  event: RequestEvent,
  roles?: string[],
  opts: { live?: boolean; allowRoleChange?: boolean } = {}
): Promise<User | Response> {
  const token = (event.request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

  let user: User;
  try {
    user = jwt.verify(token, env.JWT_SECRET!) as User;
  } catch {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (roles || opts.live) {
    const currentUser = await fetchUser(user.email);
    if (!currentUser) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!opts.allowRoleChange && (user.role ?? '') !== (currentUser.role ?? '')) {
      return json(
        { error: 'Your role has changed. Refresh your access and try again.', code: 'ROLE_CHANGED' },
        { status: 403 }
      );
    }
    user = { ...user, ...currentUser, role: currentUser.role ?? '' };
    if (roles && !roles.includes(user.role)) {
      return json({ error: 'Access denied' }, { status: 403 });
    }
  }

  return user;
}