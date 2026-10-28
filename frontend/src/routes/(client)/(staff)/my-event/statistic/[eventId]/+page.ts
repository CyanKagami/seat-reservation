import type { PageLoad } from './$types';
import { getReservationStatistic, getSeatMap } from '$lib/scripts/booking';

export const load: PageLoad = async ({ fetch, params, depends }) => {
    depends('change:seatmap');
    try {
        const [result, seatMap] = await Promise.all([
            getReservationStatistic(params.eventId, fetch),
            getSeatMap(params.eventId, fetch)
        ]);
        return { ...result, reservations: seatMap.reservations, loadError: false };
    }
    catch {
        return {
            loadError: true,
            zoneData: {},
            reservations: [],
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