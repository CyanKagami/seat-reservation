import { ZoneEditorState } from '$lib/components/zone-editor/zoneState.svelte';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Event } from '$lib/type/event';
import { getSeatMap } from '$lib/scripts/booking';
import { apiFetch, apiFetchJson } from '$lib/scripts/api';
import { requireSuccessfulResponse, withRouteErrors } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ params, fetch }) => withRouteErrors(async () => {
    const [events, seatMap] = await Promise.all([
        apiFetchJson<Event[]>(`/event/getFromId/${params.eventId}`, { method: 'GET' }, fetch),
        getSeatMap(params.eventId, fetch)
    ]);
    const event = events[0];
    if (!event?.place?.placeId) error(404, 'ไม่พบกิจกรรมหรือสถานที่จัดงาน');

    const response = await apiFetch(`/event/layout?eventId=${encodeURIComponent(params.eventId)}`, {
        method: 'GET'
    }, fetch);
    await requireSuccessfulResponse(response, `ไม่สามารถโหลดแผนผังที่นั่งได้ (${response.status})`);
    const layoutData = await response.arrayBuffer();
    let seatState = new ZoneEditorState(event.place.placeId, params.eventId);
    seatState.loadFromMessagePack(layoutData);
	return {
		event,
		seatState,
        seatMap
	};
});