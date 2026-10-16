// /api/place/[placeId]/+server.ts
import { json, type RequestHandler } from "@sveltejs/kit";
import { fetchAllData } from "$lib/scripts/dynamo";
import { guard } from "$lib/scripts/guard";
import type { User } from "$lib/type/user";

function validateEventReservationRequest(user:User, body: any) {
    // TODO: Implement validation logic for the reservation request body
    return true; // Placeholder for actual validation
}

export const GET: RequestHandler = async (event) => {
    const user = await guard(event);
    if (user instanceof Response) return user;

    try {
        let data = await fetchAllData("reservations", {eventId: event.params.eventId});
        return json({ body: data });
    } catch (error) {
        console.error('Error fetching event:', error);
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
}

export const POST: RequestHandler = async (event) => {
    const user = await guard(event);
    if (user instanceof Response) return user;

    try {
        let data = await fetchAllData("reservations", {eventId: event.params.eventId});
        return json({ body: data });
    } catch (error) {
        console.error('Error fetching event:', error);
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
}
