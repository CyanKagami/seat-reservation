// /api/editRole/+server.ts
import { json, type RequestHandler } from "@sveltejs/kit";
import { updateAllAttributes } from "$lib/scripts/server/dynamo";
import { guard } from "$lib/scripts/server/guard";

const VALID_ROLES = ['admin', 'organizer', 'guest']; 

export const POST: RequestHandler = async (event) => {
      const user = await guard(event, ['admin'], { live: true });
    if (user instanceof Response) return user;
    
    const email = event.url.searchParams.get('email');
    const role = event.url.searchParams.get('role');

    if (!email || !role) {
        return json({ error: 'Missing required parameters' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
        return json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }
    try {
        const newAttributes = await updateAllAttributes('users', { email }, { role });
        return json({ body: { message: 'User role updated successfully', updatedUser:newAttributes } });
    } catch (error) {
        console.error('Error updating role:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}