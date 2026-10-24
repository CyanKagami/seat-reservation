import { apiFetch } from "$lib/scripts/api";
import type { Place } from "$lib/type/place";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const response = await apiFetch("/place", {
    method: "GET"
  });
  const data = await response.json();
  const places: Place[] = data.body?.data ?? [];

  return {
    places
  };
};