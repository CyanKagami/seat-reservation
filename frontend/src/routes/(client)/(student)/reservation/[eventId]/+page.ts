import { ZoneEditorState } from '$lib/components/zone-editor/zoneState.svelte';
import type { PageLoad } from './$types';
import type { Event } from '$lib/type/event';

export const load: PageLoad = async ({ params }) => {
    const event:Event = await fetch(`/api/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })
	let layoutData = await fetch(`/api/event/layout?eventId=${params.eventId}`, {
			method: 'GET',
			credentials:'include'
		})
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