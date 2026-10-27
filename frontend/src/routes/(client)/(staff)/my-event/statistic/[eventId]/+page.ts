import type { PageLoad } from './$types';
import { getReservationStatistic } from '$lib/scripts/booking';

export const load: PageLoad = async ({ fetch, params, depends }) => {
    depends('change:seatmap')
    try {
        let result = await getReservationStatistic(params.eventId, fetch);
        return { ...result, loadError: false };
    }
    catch (err) {
        return {
            loadError: true,
            zoneData: {},
            totalReservation:0,
            totalCapacity:0,
            remainingCapacity:0,
            checkedInCount:0,
            demographic: {
            mostParticipatedFaculty: null,
            mostParticipatedYear: null
            }
        };
    }
    
};