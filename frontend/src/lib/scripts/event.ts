import { apiFetch, unwrap } from "./api";


// Each reservation carries event: { name, date, picture, place } (null if the event was deleted).
export async function deleteEvent(eventId: string, fetchFunc: typeof fetch = fetch): Promise<{}> {
  return unwrap(await apiFetch(`/event?eventId=${encodeURIComponent(eventId)}}`, {method: 'DELETE'}, fetchFunc));
}