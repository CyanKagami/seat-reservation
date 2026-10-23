import type { PageLoad } from './$types';
import { ApiError, getReservationStatistic, getSeatMap } from '$lib/scripts/booking';

export const load: PageLoad = async ({ fetch, params, depends }) => {
    depends('change:seatmap')
    try {
        let result = await getReservationStatistic(params.eventId, fetch);
        return result;
    }
    catch (err) {
        if (err instanceof ApiError){
            console.error(err.message)
        }
        return {
            zoneData: null,
            totalReservation:0,
            checkedInCount:0,
            demographic: {
            mostParticipatedFaculty: null,
            mostParticipatedYear: null
            }
        };
    }
    
};