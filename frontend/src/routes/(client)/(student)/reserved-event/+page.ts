import { apiFetchJson } from '$lib/scripts/api';
import type { ReservationWithEvent } from '$lib/type/reservation';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => ({
  events: await apiFetchJson<ReservationWithEvent[]>('/booking/mine', { method: 'GET' }, fetch)
});
