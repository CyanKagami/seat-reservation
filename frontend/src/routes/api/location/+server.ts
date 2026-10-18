// src/routes/api/location/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchAllData } from '$lib/scripts/server/dynamo';
 
// GET /api/location - list all locations
export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['admin']);
    if (user instanceof Response) return user;
    
    try {
        const data = await fetchAllData('locations');
        return json({ body: { data } });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};
 