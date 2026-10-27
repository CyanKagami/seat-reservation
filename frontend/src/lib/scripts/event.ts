import { apiFetch, unwrap } from "./api";

type EventActionResponse = { message: string };

export async function deleteEvent(eventId: string, fetchFunc: typeof fetch = fetch): Promise<EventActionResponse> {
  return unwrap(await apiFetch(`/event?eventId=${encodeURIComponent(eventId)}`, { method: "DELETE" }, fetchFunc));
}

export async function publishEvent(eventId: string, fetchFunc: typeof fetch = fetch): Promise<EventActionResponse> {
  return unwrap(await apiFetch(`/event/published?eventId=${encodeURIComponent(eventId)}`, { method: "POST" }, fetchFunc));
}

export async function unpublishEvent(eventId: string, fetchFunc: typeof fetch = fetch): Promise<EventActionResponse> {
  return unwrap(await apiFetch(`/event/published?eventId=${encodeURIComponent(eventId)}`, { method: "DELETE" }, fetchFunc));
}