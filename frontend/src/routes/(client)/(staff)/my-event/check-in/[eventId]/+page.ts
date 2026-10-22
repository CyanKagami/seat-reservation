import type { PageLoad } from './$types';
import { ApiError, getEventAttendance } from '$lib/scripts/booking';
import { apiFetch } from '$lib/scripts/api';

export const load: PageLoad = async ({ fetch, params, depends }) => {
    depends('increase:count')
    try {
        let count = await getEventAttendance(params.eventId, fetch);
        return {
            checkInCount:count.checkInCount,
            totalCount:count.totalCount
        };
    }
    catch (err) {
        if (err instanceof ApiError){
            console.error(err.message)
        }
        return {
            checkInCount:0,
            totalCount:0
        };
    }
    
};