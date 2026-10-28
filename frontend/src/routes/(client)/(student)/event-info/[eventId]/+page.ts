import { error } from '@sveltejs/kit';
import { getSeatMap } from '$lib/scripts/booking';
import { apiFetchJson } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const events = await apiFetchJson<Event[]>(
    `/event/getFromId/${params.eventId}`,
    { method: 'GET' },
    fetch
  );
  const event = events[0];
  if (!event) error(404, 'ไม่พบกิจกรรมนี้');

  const seatMap = await getSeatMap(event.eventId, fetch);
  return { event, existingReservation: seatMap.myReservation };
};
