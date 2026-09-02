<script lang='ts'>
  import ZoneChoosing from "$lib/components/ZoneChoosing.svelte";
  import ProgressBar from "$lib/components/reservation/ProgressBar.svelte";
  import EventRoom from "$lib/components/EventRoom.svelte";
  import type { Event } from "$lib/type/event.js";
  import { onMount } from "svelte";
  import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";

  let {params} = $props()
  let event:Event = $state({} as Event)
  let start_date = $state(new Date())
  let end_date = $state(new Date())
  onMount(async () => {
        console.log("page", params.eventId)
        event = await fetch(`/api/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })
        start_date = new Date(event.date.start)
        end_date = new Date(event.date.end)
      })
    // state can be "zone", "seat" and "confirm"
    let status = $state("zone")

    let zone = $state("Z1")
    let seat = $state("D2")
</script>
<div class="items-center flex flex-col gap-2 mt-10">
  <h1 class="text-3xl font-semibold">{event.name || ""}</h1>
  <ProgressBar status={status}></ProgressBar>

  {#if status === "zone"}
    <ZoneChoosing></ZoneChoosing>
  {:else if status === "seat"}
    <EventRoom></EventRoom>
  {:else}
    <div class="bg-gray-200 w-180 p-7 rounded-lg flex flex-col items-center gap-7">
      <h1 class="font-semibold text-xl">สรุปข้อมูล</h1>
      <div class="w-full flex pl-20">
        <div class="w-1/2 flex flex-col justify-center items-center gap-1">
          <div class="grid grid-cols-2 w-full">
            <p>กิจกรรม</p>
            <p>{event.name || ""}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p>วันที่จัดกิจกรรม</p>
            <p>{formatThaiDateTimeShort(start_date, end_date) || ""}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p>สถานที่จัดกิจกรรม</p>
            <p>{event.place || ""}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p>ผู้จัดกิจกรรม</p>
            <p>{event.host || ""}</p>
          </div>
          <div class="w-full my-5">
            <p class="text-xl font-semibold">Zone {zone}, Seat {seat}</p>
          </div>
        </div>
        <div class="w-1/2 flex items-center justify-end mr-15">
          <svg class="w-40" viewBox="0 0 385 370" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="320" y="169" width="65" height="141" rx="22" fill="#EA7B36"/>
          <rect y="169" width="65" height="141" rx="22" fill="#EA7B36"/>
          <rect x="33" width="320" height="311" rx="45" fill="#EA7B36"/>
          <rect x="38" y="198" width="309" height="81" fill="#D35D14"/>
          <rect x="19" y="251" width="348" height="119" rx="22" fill="#EA7B36"/>
          <rect x="28" y="314" width="328" height="50" rx="14" fill="#D35D14"/>
          </svg>

        </div>
      </div>
      <button class="w-70 p-2 bg-accent font-semibold text-white rounded-lg">Confirm</button>
    </div>
  {/if}
</div>