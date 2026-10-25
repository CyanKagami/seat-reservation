<script lang='ts'>
    import { untrack } from "svelte";
    import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
    import { registrationOpen } from "$lib/scripts/booking";
    import type { Event } from '$lib/type/event';

    const { event }: { event: Event } = $props();

    const date = untrack(() => event.date);
    const start_date = new Date(date?.start || Date.now());
    const end_date = new Date(date?.end || Date.now());

    // Registration status computation
    const isOpen = $derived(registrationOpen(event));
    const isUpcoming = $derived.by(() => {
        if (!event['register-date']?.start) return false;
        return Date.now() < new Date(event['register-date'].start).getTime();
    });
</script>

<article class="bg-white rounded-xl border border-border-subtle shadow-xs hover:shadow-md hover:border-border-strong transition-all duration-200 overflow-hidden flex flex-col justify-between group h-full">
    <div>
        <!-- Image Container with Structured Corner Status Tag -->
        <div class="relative w-full aspect-video bg-surface-subtle overflow-hidden">
            <img 
                class="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300" 
                src={event.picture || '/image/defaultEvent.png'} 
                alt={event.name}
                loading="lazy"
            />
            
            <!-- Clean Architectural Status Tag (No Pill Capsule, No Pseudo-Dot) -->
            <div class="absolute top-3 right-3">
                {#if isOpen}
                    <span class="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight bg-emerald-600 text-white shadow-xs">
                        เปิดรับจอง
                    </span>
                {:else if isUpcoming}
                    <span class="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight bg-dark/90 text-white shadow-xs border border-white/20">
                        เร็วๆ นี้
                    </span>
                {:else}
                    <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-tight bg-dark/80 text-slate-300 shadow-xs">
                        ปิดรับจอง
                    </span>
                {/if}
            </div>
        </div>

        <!-- Body Content -->
        <div class="p-5 flex flex-col gap-2.5">
            <!-- Date & Time -->
            <div class="flex items-center gap-1.5 text-xs font-medium text-dark-soft">
                <svg class="h-4 w-4 shrink-0 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <time class="truncate">{formatThaiDateTimeShort(start_date, end_date)}</time>
            </div>

            <!-- Title -->
            <h2 class="text-lg sm:text-xl font-bold text-dark group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                {event.name}
            </h2>

            <!-- Location & Host -->
            <div class="flex flex-col gap-1 text-xs sm:text-sm text-dark-soft mt-1">
                {#if event.place}
                    <div class="flex items-center gap-1.5 truncate">
                        <svg class="h-4 w-4 shrink-0 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="truncate">{event.place.name} ({event.place.location?.name || ''})</span>
                    </div>
                {/if}

                {#if event.host}
                    <p class="text-xs text-dark-muted truncate pl-5.5">
                        จัดโดย {event.host}
                    </p>
                {/if}
            </div>
        </div>
    </div>

    <!-- Footer Action -->
    <div class="p-5 pt-0">
        <a 
            href="/event-info/{event.eventId}"
            class="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 {
                isOpen 
                    ? 'bg-accent hover:bg-accent-hover text-white shadow-xs' 
                    : 'bg-surface-subtle hover:bg-border-subtle text-dark-muted hover:text-dark'
            }"
        >
            <span>ดูรายละเอียด & ผังที่นั่ง</span>
            <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </a>
    </div>
</article>
