import { ZoneEditorState } from '$lib/components/zone-editor/zoneState.svelte';
import type { PageLoad } from './$types';
import type { Event } from '$lib/type/event';
import { apiFetch } from '$lib/scripts/api';

export const load: PageLoad = async ({ params, fetch }) => {
    const event:Event = await apiFetch(`/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        }, fetch)
        .then(async (response) => {
            return (await response.json()).body[0]
        })
	let layoutData = await apiFetch(`/event/layout?eventId=${params.eventId}`, {
			method: 'GET',
			credentials:'include'
		}, fetch)
		.then((response) => {
			return response.arrayBuffer();
		})
    let seatState = new ZoneEditorState(event.place.placeId, params.eventId);
    seatState.loadFromMessagePack(layoutData);
	return {
		event,
		seatState
	};
};