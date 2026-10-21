import type { PageLoad } from './$types';
import { apiFetch } from '$lib/scripts/api';
import { BookingApiError, getSeatMap } from '$lib/scripts/booking';

export const load: PageLoad = async ({ params }) => {
    try {
        const eventSeatMap = await getSeatMap(params.eventId);
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