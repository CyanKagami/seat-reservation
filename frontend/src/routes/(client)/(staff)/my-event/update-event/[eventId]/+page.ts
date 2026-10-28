import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { apiFetchJson } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import type { Place } from '$lib/type/place';

export const load: PageLoad = async ({ fetch, params }) => {
    const [events, placeResult] = await Promise.all([
        apiFetchJson<Event[]>(`/event/getFromId/${params.eventId}`, { method: 'GET' }, fetch),
        apiFetchJson<{ data: Place[] }>('/place', { method: 'GET' }, fetch)
    ]);
    const sourceEvent = events[0];
    if (!sourceEvent) error(404, 'ไม่พบกิจกรรมนี้');
    const event: Event = {
        ...sourceEvent,
        timetable: sourceEvent.timetable ?? []
    };
    return {
        event,
        places: placeResult.data
    };
};