// src/routes/api/user/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/guard';
import { paginateReadData } from '$lib/scripts/dynamo';

// GET /api/user?nextToken=... - paginated list of users
export const GET: RequestHandler = async (event) => {
  const user = await guard(event, ['admin']);
  if (user instanceof Response) return user;

  const page = event.url.searchParams.get('nextToken') || undefined;
  try {
    const { items, nextToken } = await paginateReadData('users', 25, page);
    return json({ body: { items, nextToken } });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};