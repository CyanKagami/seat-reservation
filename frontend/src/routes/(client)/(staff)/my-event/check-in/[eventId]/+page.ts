import type { PageLoad } from './$types';
import { getEventAttendance } from '$lib/scripts/booking';
import { ApiError } from '$lib/scripts/api';
import { throwRouteError } from '$lib/scripts/routeErrors';
export const load: PageLoad = async ({ fetch, params, depends }) => {
    depends('increase:count')
    try {
        let count = await getEventAttendance(params.eventId, fetch);
        return {
            checkInCount:count.checkInCount,
            totalCount:count.totalCount,
            loadError: false
        };
    }
    catch (err) {
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
            throwRouteError(err);
        }
        return {
            checkInCount:0,
            totalCount:0,
            loadError: true,
            loadErrorMessage: err instanceof Error ? err.message : null
        };
    }
    
};