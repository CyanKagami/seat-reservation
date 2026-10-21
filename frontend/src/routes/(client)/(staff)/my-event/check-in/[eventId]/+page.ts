import type { PageLoad } from './$types';
import { BookingApiError, getSeatMap } from '$lib/scripts/booking';

export const load: PageLoad = async ({ fetch, params }) => {
    try {
        const eventSeatMap = await getSeatMap(params.eventId, fetch);
        return {
            eventSeatMap
        };
    }
    catch (err) {
        if (err instanceof BookingApiError){
            console.error(err.message)
        }
        return {
            eventSeatMap: {
                reservations: [],
                MyReservation: null
            }
        };
    }
    
};