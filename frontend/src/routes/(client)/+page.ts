import { apiFetchJson } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => ({
  events: await apiFetchJson<Event[]>('/event/', { method: 'GET' }, fetch)
});
