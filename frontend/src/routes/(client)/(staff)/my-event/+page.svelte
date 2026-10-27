<script lang='ts'>
    import StaffEventBox from "$lib/components/staff/StaffEventBox.svelte";
    import { apiFetch } from "$lib/scripts/api";
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";
    import { alertModal } from "$lib/store/alert.svelte";

    let events: Event[] = $state([]);
    let isLoading = $state(true);
    let searchQuery = $state("");

    onMount(async () => {
        try {
            isLoading = true;
            const res = await apiFetch('/event/getFromHost', { method: "GET" });
            if (!res.ok) throw new Error("Unable to load organizer events.");
            const data = await res.json();
            events = data.body || [];
        } catch (err) {
            alertModal.failure("เกิดข้อผิดพลาด", "ไม่สามารถโหลดกิจกรรมที่จัดได้ กรุณาลองอีกครั้ง");
        } finally {
            isLoading = false;
        }
    });

    const filteredEvents = $derived.by(() => {
        if (!searchQuery.trim()) return events;
        const q = searchQuery.toLowerCase().trim();
        return events.filter(e => 
            e.name?.toLowerCase().includes(q) ||
            e.place?.name?.toLowerCase().includes(q) ||
            e.place?.location?.name?.toLowerCase().includes(q)
        );
    });
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <!-- Header & Action Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-dark tracking-tight">
                กิจกรรมที่ฉันจัด
            </h1>
            <p class="text-xs sm:text-sm text-dark-soft mt-1">
                บริหารจัดการกิจกรรม, ตรวจสอบการเช็คชื่อ และดูสถิติการจองที่นั่ง
            </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Search Input -->
            <div class="relative w-full sm:w-64 md:w-72">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-soft">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="ค้นหากิจกรรม..."
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-border-strong bg-white text-dark text-sm placeholder:text-dark-soft focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-hidden"
                />
            </div>

            <!-- Create Event Button -->
            <a
                href="/my-event/create-event"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span>สร้างกิจกรรมใหม่</span>
            </a>
        </div>
    </div>

    <!-- Content -->
    <div class="pt-8">
        {#if isLoading}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {#each Array(3) as _}
                    <div class="bg-white rounded-2xl border border-border-subtle p-4 flex flex-col gap-3 animate-pulse">
                        <div class="w-full aspect-video bg-surface-subtle rounded-xl"></div>
                        <div class="h-5 bg-surface-subtle rounded-sm w-3/4"></div>
                        <div class="h-4 bg-surface-subtle rounded-sm w-1/2"></div>
                    </div>
                {/each}
            </div>
        {:else if filteredEvents.length === 0}
            <div class="bg-white rounded-2xl border border-border-subtle p-10 text-center flex flex-col items-center max-w-md mx-auto my-8">
                <div class="w-12 h-12 rounded-full bg-pale-soft flex items-center justify-center text-secondary mb-4">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-dark">
                    {searchQuery ? 'ไม่พบกิจกรรมที่ค้นหา' : 'คุณยังไม่มีกิจกรรมที่จัดขึ้น'}
                </h3>
                <p class="text-xs sm:text-sm text-dark-soft mt-1.5 leading-relaxed">
                    {searchQuery ? 'ลองตรวจสอบคำสะกด หรือล้างคำค้นหา' : 'สร้างกิจกรรมใหม่เพื่อเปิดให้นักศึกษาและบุคลากรจองที่นั่งได้'}
                </p>
                {#if !searchQuery}
                    <a
                        href="/my-event/create-event"
                        class="mt-6 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                    >
                        + สร้างกิจกรรมแรกของคุณ
                    </a>
                {/if}
            </div>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {#each filteredEvents as event (event.eventId)}
                    <StaffEventBox {event} />
                {/each}
            </div>
        {/if}
    </div>
</div>
