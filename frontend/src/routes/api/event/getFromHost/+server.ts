// src/routes/api/event/getFromHost/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/guard';
import { fetchEventFromHost } from '$lib/scripts/dynamo';

// GET /api/event/getFromHost - events created by the logged-in user
export const GET: RequestHandler = async (event) => {
    const user = await guard(event);
    if (user instanceof Response) return user;

    try {
        const data = await fetchEventFromHost(user.googleId);
        return json({ body: data });
    } catch (error) {
        console.error('Error fetching events for host:', error);
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
};