import { apiFetchJson } from "$lib/scripts/api";
import type { Place } from "$lib/type/place";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const result = await apiFetchJson<{ data: Place[] }>("/place", {
    method: "GET"
  }, fetch);
  return { places: result.data };
};