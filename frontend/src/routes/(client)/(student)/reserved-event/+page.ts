import { apiFetchJson } from '$lib/scripts/api';
import type { ReservationWithEvent } from '$lib/type/reservation';
import type { PageLoad } from './$types';
import { withRouteErrors } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ fetch }) =>
  withRouteErrors(async () => ({
    events: await apiFetchJson<ReservationWithEvent[]>('/booking/mine', { method: 'GET' }, fetch)
  }));
