<script lang='ts'>
    import ReservedEventBox from "$lib/components/student/ReservedEventBox.svelte";
  import { apiFetch } from "$lib/scripts/api";
  import type { ReservationWithEvent } from "$lib/type/reservation";
    import { onMount } from "svelte";
    let events:ReservationWithEvent[] = $state([])
    onMount(async () => {
        events = await apiFetch('/booking/mine', {
            method: "GET",
        })
        .then(async (response) => {
            return (await response.json()).body
        })
    })

</script>
<div class="mt-24 sm:mt-32 flex flex-col items-center">
    <h1 class="text-4xl font-semibold">กิจกรรมของฉัน</h1>

    <div class="pt-8 w-full px-20 flex flex-col gap-10">

        <!--Search bar-->
        <div class="flex justify-between">
            <div>
                <p class="text-sm font-semibold">Search</p>
                <input class="rounded-lg w-96">
            </div>
        </div>

        <!--Event Registration-->
        <div class="w-full flex flex-wrap gap-15 gap-y-10">
        {#if events.length === 0}
        <div class="flex justify-center items-center w-full">
            <p class="text-gray-400 text-xl">คุณยังไม่มีกิจกรรม</p>
        </div>
        {/if}
        {#each events as event }
            <ReservedEventBox event={event.event} seat={event.seat} zone={event.zone} eventId={event.eventId}></ReservedEventBox>
        {/each}
        </div>
    </div>
</div>
