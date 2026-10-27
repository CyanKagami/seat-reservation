// src/routes/api/event/getFromHost/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchEventFromHost } from '$lib/scripts/server/dynamo';

// GET /api/event/getFromHost - events created by the logged-in user
export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['organizer','admin']);
    if (user instanceof Response) return user;

    try {
        const data = await fetchEventFromHost(user.email);
        return json({ body: data });
    } catch (error) {
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
};