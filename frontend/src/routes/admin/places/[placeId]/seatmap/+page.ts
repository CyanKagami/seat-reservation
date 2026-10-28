import { error } from '@sveltejs/kit';
import { apiFetch, apiFetchJson } from '$lib/scripts/api';
import type { Place } from '$lib/type/place';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const placeResult = await apiFetchJson<{ data: Place | null }>(
    `/place/${params.placeId}`,
    { method: 'GET' },
    fetch
  );
  if (!placeResult.data) error(404, 'ไม่พบสถานที่นี้');

  const response = await apiFetch(`/place/layout?placeId=${encodeURIComponent(params.placeId)}`, {
    method: 'GET'
  }, fetch);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `ไม่สามารถโหลดแผนผังที่นั่งได้ (${response.status})`);
  }

  return { place: placeResult.data, layoutData: await response.arrayBuffer() };
};
