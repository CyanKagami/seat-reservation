import type { PageLoad } from './$types';
import { getReservationStatistic, getSeatMap } from '$lib/scripts/booking';
import { ApiError } from '$lib/scripts/api';
import { throwRouteError } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ fetch, params, depends }) => {
    depends('change:seatmap');
    try {
        const [result, seatMap] = await Promise.all([
            getReservationStatistic(params.eventId, fetch),
            getSeatMap(params.eventId, fetch)
        ]);
        return { ...result, reservations: seatMap.reservations, loadError: false };
    }
    catch (cause) {
        if (cause instanceof ApiError && (cause.status === 403 || cause.status === 404)) {
            throwRouteError(cause);
        }
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