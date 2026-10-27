import { apiFetch, unwrap } from "./api";


// Each reservation carries event: { name, date, picture, place } (null if the event was deleted).
export async function deletePlace(placeId: string, fetchFunc: typeof fetch = fetch): Promise<{}> {
  return unwrap(await apiFetch(`/place?placeId=${encodeURIComponent(placeId)}}`, {method: 'DELETE'}, fetchFunc));
}