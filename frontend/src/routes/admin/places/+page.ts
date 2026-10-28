import { apiFetchJson } from '$lib/scripts/api';
import type { CampusLocation } from '$lib/type/location';
import type { Place } from '$lib/type/place';
import type { PageLoad } from './$types';
import { withRouteErrors } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ fetch }) => withRouteErrors(async () => {
  const [placeResult, locationResult] = await Promise.all([
    apiFetchJson<{ data: Place[] }>('/place', { method: 'GET' }, fetch),
    apiFetchJson<{ data: CampusLocation[] }>('/location', { method: 'GET' }, fetch)
  ]);
  return { places: placeResult.data, locations: locationResult.data };
});
