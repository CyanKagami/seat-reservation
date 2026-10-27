<script lang='ts'>
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";
    import { formatThaiDateTime, formatThaiDateTimeShort } from "$lib/scripts/formatTime";
    import { apiFetch } from "$lib/scripts/api.js";
    import { registrationOpen } from '$lib/scripts/booking.js';

    let { params } = $props();

    let event: Event = $state({} as Event);
    let isLoading = $state(true);
    let start_date = $state(new Date());
    let end_date = $state(new Date());
    let register_date_start = $state(new Date());
    let register_date_end = $state(new Date());

    onMount(async () => {
        try {
            const res = await apiFetch(`/event/getFromId/${params.eventId}`, { method: "GET" });
            const data = await res.json();
            if (data.body && data.body.length > 0) {
                event = data.body[0];
                if (event.date?.start) start_date = new Date(event.date.start);
                if (event.date?.end) end_date = new Date(event.date.end);
                if (event["register-date"]?.start) register_date_start = new Date(event["register-date"].start);
                if (event["register-date"]?.end) register_date_end = new Date(event["register-date"].end);
            }
        } catch (err) {
            console.error("Failed to load event:", err);
        } finally {
            isLoading = false;
        }
    });

    const isRegistrationOpen = $derived(registrationOpen(event));
    const isUpcoming = $derived.by(() => {
        if (!event['register-date']?.start) return false;
        return Date.now() < new Date(event['register-date'].start).getTime();
    });
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs sm:text-sm text-dark-soft mb-6">
        <a href="/" class="hover:text-dark transition-colors">หน้าแรก</a>
        <span>/</span>
        <span class="text-dark-muted font-medium truncate max-w-xs">{event.name || 'รายละเอียดกิจกรรม'}</span>
    </nav>

    {#if isLoading}
        <div class="animate-pulse space-y-6">
            <div class="w-full h-80 bg-surface-subtle rounded-2xl"></div>
            <div class="h-8 bg-surface-subtle w-1/2 rounded-md"></div>
            <div class="h-4 bg-surface-subtle w-1/3 rounded-md"></div>
        </div>
    {:else}
        <!-- Top Spotlight Card: Image & Quick Actions -->
        <section class="bg-white rounded-2xl border border-border-subtle shadow-xs overflow-hidden mb-8 grid grid-cols-1 lg:grid-cols-12 gap-0">
            <!-- Event Banner -->
            <div class="lg:col-span-7 relative min-h-64 sm:min-h-96 bg-surface-subtle flex items-center justify-center">
                <img 
                    src={event.picture || "/image/defaultEvent.png"} 
                    alt={event.name} 
                    class="object-cover w-full h-full max-h-96"
                />
            </div>

            <!-- Summary & Registration CTA Card -->
            <div class="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
                <div class="space-y-4">
                    <div class="flex items-center gap-2 text-xs font-semibold text-secondary">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>{formatThaiDateTimeShort(start_date, end_date)}</span>
                    </div>

                    <h1 class="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight leading-tight">
                        {event.name || "ไม่มีชื่อกิจกรรม"}
                    </h1>

                    <div class="space-y-1.5 text-xs sm:text-sm text-dark-soft pt-1">
                        {#if event.place}
                            <div class="flex items-center gap-2 text-dark-muted font-medium">
                                <svg class="h-4 w-4 text-dark-soft shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>{event.place.name} ({event.place.location?.name || ''})</span>
                            </div>
                        {/if}

                        {#if event.host}
                            <p class="text-dark-soft pl-6">
                                จัดโดย <span class="font-medium text-dark-muted">{event.host}</span>
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Registration Action Box -->
                <div class="pt-6 border-t border-border-subtle mt-6">
                    {#if isRegistrationOpen}
                        <div class="space-y-3">
                            <div class="flex items-center justify-between text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-lg border border-emerald-200">
                                <span class="flex items-center gap-1.5">
                                    <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>เปิดรับจองที่นั่งแล้ว</span>
                                </span>
                                <span class="font-normal text-emerald-700">สิ้นสุด {formatThaiDateTimeShort(register_date_end)}</span>
                            </div>
                            <a 
                                href="/reservation/{params.eventId}"
                                class="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-base transition-all shadow-sm cursor-pointer"
                            >
                                <span>เลือกและจองที่นั่ง</span>
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                            </a>
                        </div>
                    {:else if isUpcoming}
                        <div class="space-y-2">
                            <div class="text-xs font-medium text-secondary bg-secondary-subtle/50 px-3 py-2.5 rounded-lg border border-secondary/20">
                                เปิดให้ลงทะเบียน: <span class="font-semibold">{formatThaiDateTime(register_date_start)}</span>
                            </div>
                            <button 
                                type="button" 
                                disabled 
                                class="w-full py-3.5 px-6 rounded-xl bg-surface-subtle text-dark-soft font-semibold text-base cursor-not-allowed border border-border-subtle"
                            >
                                ยังไม่ถึงเวลาลงทะเบียน
                            </button>
                        </div>
                    {:else}
                        <button 
                            type="button" 
                            disabled 
                            class="w-full py-3.5 px-6 rounded-xl bg-surface-subtle text-dark-soft font-semibold text-base cursor-not-allowed border border-border-subtle"
                        >
                            ปิดการลงทะเบียนแล้ว
                        </button>
                    {/if}
                </div>
            </div>
        </section>

        <!-- Detailed Information Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Left Main Column (Detail + Schedule) -->
            <div class="lg:col-span-8 space-y-8">
                <!-- Event Story / Description -->
                <section class="bg-white rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-xs">
                    <h2 class="text-lg sm:text-xl font-bold text-dark pb-3 border-b border-border-subtle">
                        รายละเอียดกิจกรรม
                    </h2>
                    <div class="prose max-w-none text-dark-muted leading-relaxed text-sm sm:text-base mt-4 whitespace-pre-line">
                        {event.detail || "ไม่มีรายละเอียดเพิ่มเติมสำหรับกิจกรรมนี้"}
                    </div>
                </section>

                <!-- Timetable / กำหนดการ (if provided) -->
                {#if event.timetable && event.timetable.length > 0}
                    <section class="bg-white rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-xs">
                        <h2 class="text-lg sm:text-xl font-bold text-dark pb-3 border-b border-border-subtle flex items-center justify-between">
                            <span>กำหนดการกิจกรรม</span>
                            <span class="text-xs font-normal text-dark-soft">{event.timetable.length} วัน</span>
                        </h2>

                        <div class="mt-6 space-y-6">
                            {#each event.timetable as day, dayIdx}
                                <div class="border border-border-subtle rounded-xl p-4 sm:p-5 bg-surface-base">
                                    <div class="font-semibold text-sm text-secondary mb-3 flex items-center gap-2">
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        <span>วันที่ {dayIdx + 1}: {day.date}</span>
                                    </div>

                                    {#if day.activity && day.activity.length > 0}
                                        <div class="space-y-2.5">
                                            {#each day.activity as act}
                                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-2.5 rounded-lg bg-white border border-border-subtle text-xs sm:text-sm">
                                                    <span class="font-mono font-medium text-dark-muted shrink-0">
                                                        {act.start} – {act.end}
                                                    </span>
                                                    <span class="font-medium text-dark flex-1 sm:text-right">
                                                        {act.activity}
                                                    </span>
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <p class="text-xs text-dark-soft">ไม่มีรายการกิจกรรมย่อย</p>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </section>
                {/if}
            </div>

            <!-- Right Column (Important Specs & Conditions) -->
            <div class="lg:col-span-4 space-y-6">
                <!-- Registration Window Info -->
                <section class="bg-white rounded-2xl border border-border-subtle p-6 shadow-xs space-y-3">
                    <h3 class="text-sm font-bold text-dark uppercase tracking-wider text-dark-soft">
                        ระยะเวลาลงทะเบียน
                    </h3>
                    <div class="text-sm text-dark-muted space-y-1">
                        <p><span class="font-semibold text-dark">เริ่ม:</span> {formatThaiDateTime(register_date_start)}</p>
                        <p><span class="font-semibold text-dark">สิ้นสุด:</span> {formatThaiDateTime(register_date_end)}</p>
                    </div>
                </section>

                <!-- Event Schedule Info -->
                <section class="bg-white rounded-2xl border border-border-subtle p-6 shadow-xs space-y-3">
                    <h3 class="text-sm font-bold text-dark uppercase tracking-wider text-dark-soft">
                        ช่วงเวลากิจกรรม
                    </h3>
                    <div class="text-sm text-dark-muted space-y-1">
                        <p><span class="font-semibold text-dark">วันเริ่ม:</span> {formatThaiDateTime(start_date)}</p>
                        <p><span class="font-semibold text-dark">วันสิ้นสุด:</span> {formatThaiDateTime(end_date)}</p>
                    </div>
                </section>

                <!-- Venue Info -->
                {#if event.place}
                    <section class="bg-white rounded-2xl border border-border-subtle p-6 shadow-xs space-y-3">
                        <h3 class="text-sm font-bold text-dark uppercase tracking-wider text-dark-soft">
                            สถานที่จัดงาน
                        </h3>
                        <div class="text-sm text-dark-muted">
                            <p class="font-semibold text-dark">{event.place.name}</p>
                            {#if event.place.location}
                                <p class="text-xs text-dark-soft mt-0.5">{event.place.location.name}</p>
                            {/if}
                        </div>
                    </section>
                {/if}

                <!-- Conditions & Rules -->
                <section class="bg-white rounded-2xl border border-border-subtle p-6 shadow-xs space-y-3">
                    <h3 class="text-sm font-bold text-dark uppercase tracking-wider text-dark-soft">
                        เงื่อนไขการเข้าร่วม
                    </h3>
                    <p class="text-sm text-dark-muted leading-relaxed">
                        {event.condition || "ไม่มีเงื่อนไขการสมัครเข้าร่วมกิจกรรม"}
                    </p>
                </section>
            </div>
        </div>
    {/if}
</div>
