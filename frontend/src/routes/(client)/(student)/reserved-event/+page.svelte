<script lang='ts'>
    import ReservedEventBox from "$lib/components/student/ReservedEventBox.svelte";
    import { invalidateAll } from "$app/navigation";
    import type { ReservationWithEvent } from "$lib/type/reservation";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    let events: ReservationWithEvent[] = $derived(data.events);
    let searchQuery = $state("");
    const refreshReservations = () => invalidateAll();

    const filteredEvents = $derived.by(() => {
        if (!searchQuery.trim()) return events;
        const q = searchQuery.toLowerCase().trim();
        return events.filter(e => 
            e.event?.name?.toLowerCase().includes(q) ||
            e.seat?.toLowerCase().includes(q) ||
            e.zone?.toLowerCase().includes(q) ||
            e.event?.place?.name?.toLowerCase().includes(q)
        );
    });
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-dark tracking-tight">
                ที่นั่งที่ฉันจองไว้
            </h1>
            <p class="text-xs sm:text-sm text-dark-soft mt-1">
                รายการที่นั่งและกิจกรรมทั้งหมดที่คุณได้ลงทะเบียนไว้
            </p>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-80">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-soft">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
            </div>
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="ค้นหาชื่อกิจกรรม หรือที่นั่ง..."
                class="w-full pl-9 pr-3 py-2 rounded-xl border border-border-strong bg-white text-dark text-sm placeholder:text-dark-soft focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-hidden"
            />
        </div>
    </div>

    <!-- Content -->
    <div class="pt-8">
        {#if filteredEvents.length === 0}
            <div class="bg-white rounded-2xl border border-border-subtle p-12 text-center flex flex-col items-center max-w-lg mx-auto my-8">
                <div class="w-12 h-12 rounded-full bg-pale-soft flex items-center justify-center text-secondary mb-4">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-dark">
                    {searchQuery ? 'ไม่พบที่นั่งที่ตรงกับคำค้นหา' : 'คุณยังไม่มีที่นั่งที่จองไว้'}
                </h3>
                <p class="text-xs sm:text-sm text-dark-soft mt-1.5 leading-relaxed">
                    {searchQuery ? 'ลองตรวจสอบคำสะกด หรือล้างคำค้นหา' : 'เลือกดูกิจกรรมที่กำลังเปิดรับสมัคร และจองที่นั่งของคุณได้ทันที'}
                </p>
                {#if !searchQuery}
                    <a 
                        href="/" 
                        class="mt-6 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                    >
                        สำรวจกิจกรรมที่เปิดจอง
                    </a>
                {/if}
            </div>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {#each filteredEvents as item (item.eventId + item.seat)}
                    {#if item.event}
                        <ReservedEventBox 
                            event={item.event} 
                            seat={item.seat} 
                            zone={item.zone} 
                            seatId={item.seatId}
                            checkInSeatId={item.checkInSeatId}
                            eventId={item.eventId}
                            onCancelled={refreshReservations}
                        />
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
</div>
