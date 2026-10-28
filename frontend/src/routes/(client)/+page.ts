import { apiFetchJson } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import type { PageLoad } from './$types';
import { withRouteErrors } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ fetch }) =>
  withRouteErrors(async () => ({
    events: await apiFetchJson<Event[]>('/event/', { method: 'GET' }, fetch)
  }));
