// วางข้าง +page.svelte ของหน้า event-info (โฟลเดอร์ [eventId])
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { apiFetchJson } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import { withRouteErrors } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ fetch, params }) => withRouteErrors(async () => {
    const events = await apiFetchJson<Event[]>(`/event/getFromId/${params.eventId}`, {
        method: 'GET'
    }, fetch);
    const event = events[0];
    if (!event) {
        error(404, 'ไม่พบกิจกรรมนี้');
    }

    return {
        event: {
            ...event,
            timetable: event.timetable ?? [],
            picture: event.picture ?? null
        }
    };
});