import { ZoneEditorState } from '$lib/components/zone-editor/zoneState.svelte';
import type { PageLoad } from './$types';
import type { Event } from '$lib/type/event';

export const load: PageLoad = async ({ fetch, params }) => {
    const event = await fetch(`/api/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })
    if (!event.timetable) {
        event.timetable = [];
    }
    if (!event.picture) {
        event.picture = null;
    }
    const places = await fetch('/api/place', {
        method:"GET",
        credentials:'include'
      })
      .then((response) => response.json())
      .then((data) => {
        return data.body.data;
      })
    return {
        event,
        places
    };
};