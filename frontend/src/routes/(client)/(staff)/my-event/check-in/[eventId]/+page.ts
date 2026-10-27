import type { PageLoad } from './$types';
import { getEventAttendance } from '$lib/scripts/booking';
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
        return {
            checkInCount:0,
            totalCount:0,
            loadError: true
        };
    }
    
};