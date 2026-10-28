export const ssr = false;
import { userStore } from "$lib/store/auth.svelte";
import { error, redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { apiFetch } from "$lib/scripts/api";
import { saveToken } from "$lib/scripts/auth";

export const load: LayoutLoad = async ({ fetch, url }) => {
    if (url.pathname === "/login") {
        return {user: null};
    }
    let response = await apiFetch(`/auth/me`, {
        method: "GET",
    }, fetch);
    if (!response.ok) {
        userStore.setUser(null);
        if (response.status === 401) throw redirect(302, "/login");
        if (response.status === 403) error(403, "คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        throw new Error(`ไม่สามารถโหลดข้อมูลบัญชีได้ (${response.status})`);
    }
    let userData = await response.json();
    if (typeof userData.token === "string" && userData.token) {
        saveToken(userData.token);
    }
    userStore.setUser(userData.body);
    if (!userData.body) {
        throw redirect(302, "/login");
    }
    return {
        user: userStore.currentUser,
    };
};
