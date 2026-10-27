// วางข้าง +page.svelte ของหน้า event-info (โฟลเดอร์ [eventId])
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { apiFetch } from '$lib/scripts/api';

export const load: PageLoad = async ({ fetch, params }) => {
    const [eventRes, placesRes] = await Promise.all([
        apiFetch(`/event/getFromId/${params.eventId}`, {
            method: 'GET',
            credentials: 'include'
        }, fetch),
        apiFetch('/place', {
            method: 'GET',
            credentials: 'include'
        }, fetch)
    ]);

    // เช็ก status ก่อนอ่าน JSON: ถ้า backend/ngrok ล่ม จะได้ข้อความที่อ่านรู้เรื่อง
    // แทน "Unexpected token 'T' ... is not valid JSON"
    if (!eventRes.ok || !placesRes.ok) {
        error(502, 'โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ');
    }

    const event = (await eventRes.json()).body?.[0];
    if (!event) {
        error(404, 'ไม่พบกิจกรรมนี้');
    }

    return {
        event: {
            ...event,
            timetable: event.timetable ?? [],
            picture: event.picture ?? null
        },
        places: (await placesRes.json()).body.data
    };
};