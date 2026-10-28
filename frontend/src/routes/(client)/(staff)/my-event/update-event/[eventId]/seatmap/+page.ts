import { error } from '@sveltejs/kit';
import { apiFetch, apiFetchJson } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const events = await apiFetchJson<Event[]>(
    `/event/getFromId/${params.eventId}`,
    { method: 'GET' },
    fetch
  );
  const event = events[0];
  if (!event?.place?.placeId) error(404, 'ไม่พบกิจกรรมหรือสถานที่จัดงาน');

  const response = await apiFetch(`/event/layout?eventId=${encodeURIComponent(params.eventId)}`, {
    method: 'GET'
  }, fetch);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `ไม่สามารถโหลดแผนผังที่นั่งได้ (${response.status})`);
  }

  return { place: event.place, layoutData: await response.arrayBuffer() };
};
