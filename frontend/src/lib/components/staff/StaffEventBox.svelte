<script lang='ts'>
    import { untrack } from "svelte";
    import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
    import type { Event } from '$lib/type/event';

    const { event }: { event: Event } = $props();

    const date = untrack(() => event.date);
    const start_date = new Date(date?.start || Date.now());
    const end_date = new Date(date?.end || Date.now());
</script>

<article class="bg-white rounded-2xl border border-border-subtle shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
    <div>
        <!-- Image Header -->
        <div class="relative w-full aspect-video bg-surface-subtle overflow-hidden">
            <img 
                class="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300" 
                src={event.picture || '/image/defaultEvent.png'} 
                alt={event.name}
            />
            <div class="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent"></div>
            
            <div class="absolute bottom-3 left-3 text-white text-xs font-medium drop-shadow-xs">
                {formatThaiDateTimeShort(start_date, end_date)}
            </div>
        </div>

        <!-- Body Content -->
        <div class="p-5 flex flex-col gap-2">
            <h2 class="text-lg font-bold text-dark group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                {event.name}
            </h2>

            {#if event.place}
                <div class="flex items-center gap-1.5 text-xs text-dark-soft">
                    <svg class="h-4 w-4 shrink-0 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="truncate">{event.place.name} ({event.place.location?.name || ''})</span>
                </div>
            {/if}

            {#if event.host}
                <p class="text-xs text-dark-muted">
                    ผู้จัด: {event.host}
                </p>
            {/if}
        </div>
    </div>

    <!-- Organizer Actions Grid -->
    <div class="p-5 pt-0 flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-2">
            <a 
                href="/my-event/check-in/{event.eventId}" 
                class="py-2 px-3 rounded-lg bg-surface-subtle hover:bg-border-subtle text-dark font-medium text-xs text-center transition-colors flex items-center justify-center gap-1.5 border border-border-subtle"
            >
                <svg class="h-3.5 w-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>เช็คชื่อ</span>
            </a>

            <a 
                href="/my-event/statistic/{event.eventId}" 
                class="py-2 px-3 rounded-lg bg-surface-subtle hover:bg-border-subtle text-dark font-medium text-xs text-center transition-colors flex items-center justify-center gap-1.5 border border-border-subtle"
            >
                <svg class="h-3.5 w-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>สถิติที่นั่ง</span>
            </a>
        </div>

        <a 
            href="/my-event/event-info/{event.eventId}" 
            class="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary-hover text-white font-semibold text-xs sm:text-sm text-center transition-colors shadow-2xs"
        >
            รายละเอียดกิจกรรม
        </a>
    </div>
</article>
