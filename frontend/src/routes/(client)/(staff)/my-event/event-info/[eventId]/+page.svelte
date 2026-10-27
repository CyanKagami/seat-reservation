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

    function fmtDateTime(value: unknown) {
        if (!value) return "-";
        const date = new Date(value as string | number | Date);
        return `${fmtDate(date)} เวลา ${fmtTime(date)}`;
    }
</script>

<div class="mx-auto mb-5 mt-6 grid w-[92vw] max-w-6xl grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_18rem] max-md:w-[calc(100%-1.5rem)]">
    <nav class="order-0 col-span-full mb-[-0.75rem] flex min-w-0 items-center gap-2 text-sm text-dark-soft" aria-label="Breadcrumb">
        <a href="/my-event" class="transition-colors hover:text-dark">กิจกรรมของฉัน</a>
        <span aria-hidden="true">/</span>
        <span class="truncate font-semibold text-dark-muted">{event.name || "รายละเอียดกิจกรรม"}</span>
    </nav>

    <main class="order-2 min-w-0 rounded-2xl border border-border-subtle bg-white p-4 shadow-xs sm:p-8 md:order-1">
        <h1 class="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-dark">รายละเอียดกิจกรรม</h1>

        <div class="flex min-w-0 flex-col gap-4">
            <div class="aspect-[16/7] w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface-subtle max-md:aspect-video">
                <img
                    src={event.picture || "/image/defaultEvent.png"}
                    alt={event.name || "ภาพกิจกรรม"}
                    class="h-full w-full object-cover"
                />
            </div>

            <div class="py-5">
                <h2 class="mb-4 text-3xl font-extrabold leading-tight text-dark wrap-break-word">
                    {event.name || "ไม่มีชื่อกิจกรรม"}
                </h2>
                <p class="mt-2 flex items-start gap-2.5 text-base leading-relaxed text-dark-muted">
                    <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.828 0l-4.243-4.243a8 8 0 1 1 11.314 0Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span>
                        <span class="mb-0.5 block text-sm font-bold text-dark-soft">สถานที่จัดกิจกรรม</span>
                        {place ? `${place.name} (${place.location.name})` : "-"}
                    </span>
                </p>
                <p class="mt-2 flex items-start gap-2.5 text-base leading-relaxed text-dark-muted">
                    <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-12.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>
                        <span class="mb-0.5 block text-sm font-bold text-dark-soft">ผู้จัดกิจกรรม</span>
                        {event.host || "-"}
                    </span>
                </p>
            </div>

            <section class="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
                <h3 class="mb-3 border-b border-border-subtle pb-3 text-lg font-bold text-dark">คำอธิบาย</h3>
                <p class="whitespace-pre-line text-sm leading-relaxed text-dark-muted wrap-break-word">
                    {event.detail || "-"}
                </p>
            </section>

            <section class="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
                <h3 class="mb-3 border-b border-border-subtle pb-3 text-lg font-bold text-dark">เงื่อนไขการเข้าร่วมกิจกรรม</h3>
                <p class="text-sm leading-relaxed text-dark-muted wrap-break-word">
                    {event.condition || "ไม่มี"}
                </p>
            </section>

            <div class="grid grid-cols-1 gap-4 min-[561px]:grid-cols-2">
                <section class="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
                    <h3 class="mb-3 border-b border-border-subtle pb-3 text-lg font-bold text-dark">เวลาเปิดลงทะเบียน</h3>
                    <div class="grid gap-1.5 text-sm leading-relaxed text-dark-muted">
                        <p class="m-0"><span class="font-semibold text-dark">เริ่ม:</span> {fmtDateTime(event["register-date"]?.start)}</p>
                        <p class="m-0"><span class="font-semibold text-dark">สิ้นสุด:</span> {fmtDateTime(event["register-date"]?.end)}</p>
                    </div>
                </section>

                <section class="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
                    <h3 class="mb-3 border-b border-border-subtle pb-3 text-lg font-bold text-dark">ช่วงเวลาจัดกิจกรรม</h3>
                    <div class="grid gap-1.5 text-sm leading-relaxed text-dark-muted">
                        <p class="m-0"><span class="font-semibold text-dark">วันเริ่ม:</span> {fmtDateTime(event.date?.start)}</p>
                        <p class="m-0"><span class="font-semibold text-dark">วันสิ้นสุด:</span> {fmtDateTime(event.date?.end)}</p>
                    </div>
                </section>
            </div>

            <section class="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
                <h3 class="mb-0 border-b border-border-subtle pb-3 text-lg font-bold text-dark">ตารางกิจกรรม</h3>
                {#each timetable as day, dayIdx}
                    <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-border-subtle bg-surface-base p-4">
                        <h4 class="m-0 text-sm font-bold text-dark">วันที่ {dayIdx + 1}: {fmtDay(day.date)}</h4>
                        {#if day.activity?.length}
                            <div class="grid gap-2.5">
                                {#each day.activity as act}
                                    <div class="flex flex-col gap-1 rounded-lg border border-border-subtle bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                        <span class="shrink-0 font-mono text-xs font-medium text-dark-muted">{act.start} – {act.end}</span>
                                        <span class="flex-1 font-medium text-dark wrap-break-word sm:text-right">{act.activity}</span>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p class="m-0 text-sm text-dark-soft">ไม่มีรายการกิจกรรมย่อย</p>
                        {/if}
                    </div>
                {:else}
                    <p class="m-0 text-sm text-dark-muted">ยังไม่มีตารางกิจกรรม</p>
                {/each}
            </section>

            <section class="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
                <h3 class="mb-3 border-b border-border-subtle pb-3 text-lg font-bold text-dark">แผนผังที่นั่ง</h3>
                <!-- TODO: ต้องรู้โครงสร้างข้อมูลที่นั่งของ place ก่อนถึงจะวาดได้ -->
                <p class="m-0 text-sm leading-relaxed text-dark-muted">
                    ยังไม่ได้เชื่อมข้อมูลที่นั่ง
                </p>
            </section>
        </div>
    </main>

    <aside class="order-1 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-white p-5 shadow-xs md:order-2 md:sticky md:top-[calc(var(--nav-h,4rem)+3.25rem)]">
        <h2 class="mb-1 text-lg font-bold text-dark">ดำเนินการ</h2>
        <a href={`/event-info/${params.eventId}`} class="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-400 bg-white px-4 py-2 text-center text-sm transition-colors hover:bg-surface-subtle">
            เผยแพร่
        </a>
        <a href={editHref} class="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-400 bg-white px-4 py-2 text-center text-sm transition-colors hover:bg-surface-subtle">
            แก้ไข
        </a>
        <button type="button" disabled title="ยังไม่รองรับการลบกิจกรรม" class="min-h-11 cursor-not-allowed rounded-xl bg-accent px-5 py-2 text-sm text-white opacity-50">
            ลบ
        </button>
        <!-- ยังไม่ทำอะไร -->
        <a href={`/my-event/statistic/${params.eventId}`} class="inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-5 py-2 text-sm text-white transition-colors duration-200 hover:bg-secondary-hover">
            Statistic
        </a>
        <a href={`/my-event/check-in/${params.eventId}`} class="inline-flex min-h-11 items-center justify-center rounded-xl bg-green px-5 py-2 text-sm text-white transition-colors duration-200 hover:bg-green-hover">
            Check in
        </a>
    </aside>
</div>
