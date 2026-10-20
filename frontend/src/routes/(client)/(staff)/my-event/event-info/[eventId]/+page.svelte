<!-- เช่น src/routes/(client)/(staff)/my-event/event-info/[eventId]/+page.svelte -->
<script lang="ts">
    import type { PageProps } from "./$types";
    import type { Event as MyEvent, Daytable } from "$lib/type/event";
    import type { Place } from "$lib/type/place";
    import { redirect } from "@sveltejs/kit";

    export const load = () => {
        redirect(307, "/my-event");
    };

    // data มาจากไฟล์ load (+page.server.ts / +page.ts) ในโฟลเดอร์เดียวกัน
    // ต้องคืน { event, places } เหมือนหน้า update-event
    let { params, data }: PageProps = $props();

    const event: MyEvent = $derived(data.event);
    const places: Place[] = $derived(data.places);
    const timetable: Daytable[] = $derived(data.event.timetable ?? []);
    const place = $derived(
        places.find((p) => p.placeId === event.place?.placeId),
    );

    // ปรับ path ให้ตรงกับ route จริงของหน้า update-event
    const editHref = $derived(`/my-event/update-event/${params.eventId}`);

    const fmtDate = (d: Date) =>
        d.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    const fmtTime = (d: Date) =>
        d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    // "YYYY-MM-DD" ต้องต่อ T00:00:00 ไม่งั้นถูกตีเป็น UTC แล้ววันอาจเลื่อน
    const fmtDay = (s: string) =>
        s ? fmtDate(new Date(`${s}T00:00:00`)) : "-";

    type Range = { start?: unknown; end?: unknown } | undefined;
    function fmtRange(r: Range) {
        if (!r?.start || !r?.end) return "-";
        const s = new Date(r.start as string | number | Date);
        const e = new Date(r.end as string | number | Date);
        return `วันที่ ${fmtDate(s)} เวลา ${fmtTime(s)} ถึง วันที่ ${fmtDate(e)} เวลา ${fmtTime(e)}`;
    }
</script>

<div class="event-card">
    <h1 class="mb-4 text-4xl font-bold">รายละเอียดกิจกรรม</h1>

    <div class="event-layout">
        <!-- ซ้าย: ข้อมูลกิจกรรม (แสดงอย่างเดียว) -->
        <div class="flex min-w-0 flex-col gap-5">
            <div class="cover">
                {#if event.picture}
                    <img
                        src={event.picture}
                        alt={event.name}
                        class="h-full w-full object-cover"
                    />
                {/if}
            </div>

            <div class="flex flex-col gap-2">
                <h2 class="text-3xl font-bold wrap-break-word">{event.name}</h2>
                <p>
                    <span class="font-bold">สถานที่จัดกิจกรรม:</span>
                    {place ? `${place.name} (${place.location.name})` : "-"}
                </p>
                <p>
                    <span class="font-bold">ผู้จัดกิจกรรม:</span>
                    {event.host}
                </p>
            </div>

            <section>
                <h3 class="mb-1 font-bold">คำอธิบาย</h3>
                <p class="whitespace-pre-line break-words text-sm">{event.detail || "-"}</p>
            </section>

            <section>
                <h3 class="mb-1 font-bold">เงื่อนไขการเข้าร่วมกิจกรรม</h3>
                <p class="text-sm break-words">{event.condition || "ไม่มี"}</p>
            </section>

            <section>
                <h3 class="mb-1 font-bold">เวลาเปิดลงทะเบียน</h3>
                <p class="text-sm text-red-500">
                    {fmtRange(event["register-date"])}
                </p>
            </section>

            <section>
                <h3 class="mb-1 font-bold">ช่วงเวลาจัดกิจกรรม</h3>
                <p class="text-sm text-red-500">{fmtRange(event.date)}</p>
            </section>

            <section class="flex flex-col gap-4">
                <h3 class="font-bold">ตารางกิจกรรม</h3>
                {#each timetable as day}
                    <div class="flex flex-col gap-2">
                        <p class="text-sm font-bold">{fmtDay(day.date)}</p>
                        <div class="table-box">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-gray-200">
                                        <th class="p-2 font-bold"
                                            >เริ่มกิจกรรม</th
                                        >
                                        <th class="p-2 font-bold"
                                            >สิ้นสุดกิจกรรม</th
                                        >
                                        <th class="p-2 font-bold">กิจกรรม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each day.activity as act, ai}
                                        <tr
                                            class="text-center {ai % 2 === 0
                                                ? 'bg-gray-100'
                                                : ''}"
                                        >
                                            <td class="p-2">{act.start}</td>
                                            <td class="p-2">{act.end}</td>
                                            <td class="p-2">{act.activity}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {:else}
                    <p class="text-sm text-gray-500">ยังไม่มีตารางกิจกรรม</p>
                {/each}
            </section>

            <section>
                <h3 class="mb-1 font-bold">แผนผังที่นั่ง</h3>
                <!-- TODO: ต้องรู้โครงสร้างข้อมูลที่นั่งของ place ก่อนถึงจะวาดได้ -->
                <p class="text-sm text-gray-500">
                    ยังไม่ได้เชื่อมข้อมูลที่นั่ง
                </p>
            </section>
        </div>
    </div>
</div>



<div class="event-card">
        <!-- ขวา: ดำเนินการ -->
        <aside class="flex flex-col gap-3">
            <h3 class="font-bold">ดำเนินการ</h3>
            <!-- แก้ไข: พาไปหน้า update-event -->
            <a
                href={editHref}
                class="rounded border border-gray-400 bg-white py-1.5 text-center hover:cursor-pointer"
            >
                แก้ไข
            </a>
            <!-- ยังไม่ทำอะไร -->
            <button
                type="button"
                class="bg-secondary px-5 py-2 text-white rounded-lg hover:cursor-pointer hover:bg-secondary-hover transition-colors duration-200"
            >
                Statistic
            </button>
            <button
                type="button"
                class="bg-accent px-5 py-2 text-white rounded-lg hover:cursor-pointer hover:bg-accent-hover transition-colors duration-200"
            >
                Check in
            </button>
        </aside>
</div>

<style>
    .event-card {
        width: min(72rem, 92vw);
        margin: 1.25rem auto;
        align-self: center;
        padding: 2rem;
        border-radius: 1rem;
        background: #f3f4f6;
    }

    .event-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 20rem;
        gap: 2rem;
        align-items: start;
    }
    .cover {
        position: relative;
        width: 100%;
        max-width: 500px;
        aspect-ratio: 16 / 9; /* เดิม 5 / 4 */
        overflow: hidden;
        border-radius: 1rem;
        border: 2px solid #d1d5db;
        background: #d1d5db;
    }
    .table-box {
        overflow: hidden;
        border-radius: 0.5rem;
        border: 1px solid #000;
        background: #fff;
    }
    .table-box thead tr {
        border-bottom: 1px solid #000;
    }
    .table-box tbody tr + tr {
        border-top: 1px solid #000;
    }
    .table-box th + th,
    .table-box td + td {
        border-left: 1px solid #000;
    }
    @media (max-width: 767px) {
        .event-layout {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
