<script lang='ts'>
  import { setContext, untrack } from "svelte";
  import {formatThaiDateTimeShort} from "$lib/scripts/formatTime"
  import { cancelSeat } from "$lib/scripts/booking";
    const {event, seat, eventId} = $props()

    const date = untrack(()=>event.date)
    const start_date = new Date(date.start)
    const end_date = new Date(date.end)


</script>

<div class="w-96 h-84 border border-gray-400 rounded-lg">
    <div class="w-full h-40 relative">
    <img class="object-cover w-full h-full z-0 absolute top-0 left-0 rounded-t-lg" src={event.picture} alt={event.name}>
    <!-- Added z-10 below -->
    <div class="absolute top-5 right-5 z-10 bg-white p-2 rounded-lg">
        <p class="text-xl font-semibold ">ที่นั่ง {seat}</p>
    </div>
    </div>
    <div class="p-5">
        <h1 class="text-2xl font-semibold truncate">{event.name}</h1>
        <p class="text-sm font-semibold truncate">{formatThaiDateTimeShort(start_date, end_date)}</p>
        <div class="flex w-full justify-between gap-5">
            <button class="w-1/2 px-5 py-2 rounded-xl font-semibold mt-3 text-lg hover:cursor-pointer hover:bg-black hover:text-white transition-colors duration-200 border" onclick={() => cancelSeat(eventId, seat)}>ยกเลิก</button>
            <a class="w-1/2" href="/event-info/{eventId}">
                <button class="bg-accent w-full px-5 py-2 rounded-xl text-white font-semibold mt-3 text-lg hover:cursor-pointer hover:bg-accent-hover transition-colors duration-200">ดูรายละเอียด</button>
            </a>
        </div>


    </div>
</div>