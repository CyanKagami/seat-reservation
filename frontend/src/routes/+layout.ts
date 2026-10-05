export const ssr = false;
import { userStore } from "$lib/store/auth.svelte";
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { apiFetch } from "$lib/scripts/api";

export const load: LayoutLoad = async ({ fetch }) => {
    if (userStore.currentUser) {
        return {
            user: userStore.currentUser,
        };
    }
    let response = await apiFetch(fetch, `/auth/me`, {
        method: "GET",
    });
    let userData = await response.json();
    userStore.setUser(userData.body);
    if (userData.body === null) {
        throw redirect(302, "/login");
    }
    return {
        user: userStore.currentUser,
    };
};
