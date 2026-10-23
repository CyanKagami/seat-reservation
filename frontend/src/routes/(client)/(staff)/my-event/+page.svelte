<script lang='ts'>
    import StaffEventBox from "$lib/components/staff/StaffEventBox.svelte";
    import { apiFetch } from "$lib/scripts/api";
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";

    let events: Event[] = $state([])

    onMount(async () => {
        events = await apiFetch('/event/getFromHost', {
            method: "GET",
        })
        .then(async (response) => {
            return (await response.json()).body
        })
    })
</script>

<div class="mt-24 sm:mt-32 flex flex-col items-center w-full pb-10">
    <!-- Header -->
    <h1 class="text-2xl sm:text-4xl font-semibold text-gray-800">กิจกรรมของฉัน</h1>

    <div class="pt-6 sm:pt-8 w-full px-4 sm:px-10 lg:px-20 flex flex-col gap-8 sm:gap-10">

        <!-- Search Bar & Action Button Container -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
            <!-- Search Input -->
            <div class="w-full sm:w-80 md:w-96">
                <label class="text-xs sm:text-sm font-semibold text-gray-700 block mb-1">Search</label>
                <input
                    type="text"
                    placeholder="ค้นหากิจกรรม..."
                    class="rounded-lg w-full border-gray-300 focus:border-accent focus:ring-accent p-2.5 text-sm sm:text-base shadow-sm"
                >
            </div>

            <!-- Create Event Button -->
            <a
                href="/my-event/create-event"
                class="bg-secondary hover:bg-secondary-hover transition-colors px-5 flex items-center justify-center h-11 text-white font-medium rounded-lg shadow cursor-pointer text-sm sm:text-base whitespace-nowrap shrink-0"
            >
                + สร้างกิจกรรม
            </a>
        </div>

        <!-- Event List Grid -->
        <div class="w-full flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-10 lg:gap-12 gap-y-8">
            {#if events.length === 0}
                <div class="flex justify-center items-center w-full py-16">
                    <p class="text-gray-400 text-base sm:text-xl font-medium">คุณยังไม่มีกิจกรรม</p>
                </div>
            {/if}

            {#each events as event}
                <StaffEventBox {event}></StaffEventBox>
            {/each}
        </div>

    </div>
</div>