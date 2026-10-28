import { apiFetchJson } from '$lib/scripts/api';
import { error } from '@sveltejs/kit';
import type { CampusLocation } from '$lib/type/location';
import type { Place } from '$lib/type/place';
import type { PageLoad } from './$types';
import { withRouteErrors } from '$lib/scripts/routeErrors';

export const load: PageLoad = async ({ fetch, params }) => withRouteErrors(async () => {
  const [placeResult, locationResult] = await Promise.all([
    apiFetchJson<{ data: Place | null }>(`/place/${params.placeId}`, { method: 'GET' }, fetch),
    apiFetchJson<{ data: CampusLocation[] }>('/location', { method: 'GET' }, fetch)
  ]);
  if (!placeResult.data) error(404, 'ไม่พบสถานที่นี้');
  return { place: placeResult.data, locations: locationResult.data };
});
