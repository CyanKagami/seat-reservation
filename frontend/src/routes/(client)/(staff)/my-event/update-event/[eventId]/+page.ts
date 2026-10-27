import type { PageLoad } from './$types';
import { apiFetch } from '$lib/scripts/api';

export const load: PageLoad = async ({ fetch, params }) => {
    const event = await apiFetch(`/event/getFromId/${params.eventId}`, {
            method: "GET",
        }, fetch)
        .then(async (response) => {
            return (await response.json()).body[0]
        })
    if (!event.timetable) {
        event.timetable = [];
    }
    if (!event.picture) {
        event.picture = null;
    }
    const places = await apiFetch('/place', {
        method:"GET",
      }, fetch)
      .then((response) => response.json())
      .then((data) => {
        return data.body.data;
      })
    return {
        event,
        places
    };
};