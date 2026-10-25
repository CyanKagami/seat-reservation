<script lang='ts'>
    import { untrack } from "svelte";
    import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
    import { cancelSeat } from "$lib/scripts/booking";
    import { alertModal } from "$lib/store/alert.svelte";
    import type { EventSummary } from '$lib/type/reservation';

    interface Props {
        event: EventSummary;
        seat: string;
        zone: string;
        eventId: string;
        onCancelled?: () => void;
    }

    const { event, seat, zone, eventId, onCancelled }: Props = $props();

    const date = untrack(() => event.date);
    const start_date = new Date(date?.start || Date.now());
    const end_date = new Date(date?.end || Date.now());

    function handleCancel() {
        alertModal.warning(
            "ยกเลิกการจองที่นั่ง", 
            `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองที่นั่ง "${seat}" (โซน ${zone}) ในกิจกรรม "${event.name}"?`, 
            {
                showCancel: true,
                confirmText: "ยืนยันยกเลิก",
                cancelText: "เก็บที่นั่งไว้",
                onconfirm: async () => {
                    try {
                        await cancelSeat(eventId, seat, zone);
                        alertModal.success("ยกเลิกเรียบร้อย", "ยกเลิกการจองที่นั่งสำเร็จแล้ว", () => {
                            if (onCancelled) onCancelled();
                        });
                    } catch (err: any) {
                        alertModal.failure("เกิดข้อผิดพลาด", err?.message || "ไม่สามารถยกเลิกการจองได้");
                    }
                }
            }
        );
    }
</script>

<article class="bg-white rounded-2xl border border-border-subtle shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
    <div>
        <!-- Image & Ticket Badge Header -->
        <div class="relative w-full aspect-video bg-surface-subtle overflow-hidden">
            <img 
                class="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300" 
                src={event.picture || '/image/defaultEvent.png'} 
                alt={event.name}
            />
            <div class="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent"></div>
            
            <!-- Confirmed Seat Tag (No Pill Capsule, No Pseudo-Dot) -->
            <div class="absolute top-3 right-3 bg-dark/85 backdrop-blur-md px-2.5 py-1 rounded-md shadow-xs border border-white/20 text-xs font-bold text-white tracking-tight">
                โซน {zone} · ที่นั่ง {seat}
            </div>

            <div class="absolute bottom-3 left-3 text-white text-xs font-medium drop-shadow-xs">
                {formatThaiDateTimeShort(start_date, end_date)}
            </div>
        </div>

        <!-- Body Content -->
        <div class="p-5 flex flex-col gap-2.5">
            <h2 class="text-lg font-bold text-dark group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                {event.name}
            </h2>

            {#if event.place}
                <div class="flex items-center gap-1.5 text-xs sm:text-sm text-dark-soft">
                    <svg class="h-4 w-4 shrink-0 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="truncate">{event.place.name || ''}</span>
                </div>
            {/if}
        </div>
    </div>

    <!-- Actions Bar -->
    <div class="p-5 pt-0 flex items-center gap-3">
        <button 
            type="button"
            onclick={handleCancel}
            class="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
        >
            ยกเลิกที่นั่ง
        </button>

        <a 
            href="/event-info/{eventId}"
            class="flex-1 py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary-hover text-white font-semibold text-xs sm:text-sm transition-colors text-center shadow-2xs"
        >
            ดูรายละเอียด
        </a>
    </div>
</article>
