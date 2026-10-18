// src/routes/api/place/[placeId]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchData } from '$lib/scripts/server/dynamo';
 
// GET /api/place/:placeId - a single place
export const GET: RequestHandler = async (event) => {
  const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;
 
  try {
    const data = await fetchData('places', { placeId: event.params.placeId });
    return json({ body: { data } });
  } catch (error) {
    console.error('Error fetching place:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
 