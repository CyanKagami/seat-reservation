import { apiFetchJson } from "$lib/scripts/api";
import type { Place } from "$lib/type/place";
import type { PageLoad } from "./$types";
import { withRouteErrors } from "$lib/scripts/routeErrors";

export const load: PageLoad = async ({ fetch }) => withRouteErrors(async () => {
  const result = await apiFetchJson<{ data: Place[] }>("/place", {
    method: "GET"
  }, fetch);
  return { places: result.data };
});