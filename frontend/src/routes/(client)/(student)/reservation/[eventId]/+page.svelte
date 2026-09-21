<script lang='ts'>
  import ZoneChoosing from "$lib/components/ZoneChoosing.svelte";
  import ProgressBar from "$lib/components/reservation/ProgressBar.svelte";
  import EventRoom from "$lib/components/EventRoom.svelte";
  import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
  import ReservationZonePicker from "$lib/components/zone-editor/components/ReservationZonePicker.svelte";
  import ZoneSeatPicker from "$lib/components/zone-editor/components/ZoneSeatPicker.svelte";

  let {data} = $props() 
    // state can be "zone", "seat" and "confirm"
    let status = $state("zone")

    let zone = $state("Z1")
    let seat = $state("D2")
</script>
<div class="items-center flex flex-col gap-2 mt-10">
  <h1 class="text-3xl font-semibold">{data.event.name}</h1>
  <ProgressBar status={status}></ProgressBar>

  {#if status === "zone"}
  <div class="w-3xl bg-gray-200 h-auto py-10 self-center mt-4 flex flex-col gap-5 px-10">
    <ReservationZonePicker objects={data.seatState.objects} zone={data.seatState.zones} onZoneSelect={(zoneId) => {zone = zoneId; status = "seat"}}></ReservationZonePicker>
  </div>
  {:else if status === "seat"}
    <ZoneSeatPicker seats={data.seatState.objects.filter((s) => s.metadata?.zoneId === zone)} onBack={() => {status = "zone"}}></ZoneSeatPicker>
  {:else}
    <div class="bg-gray-200 w-180 p-7 rounded-lg flex flex-col items-center gap-7">
      <h1 class="font-semibold text-xl">สรุปข้อมูล</h1>
      <div class="w-full flex pl-20">
        <div class="w-1/2 flex flex-col justify-center items-center gap-1">
          <div class="grid grid-cols-2 w-full">
            <p>กิจกรรม</p>
            <p>{data.event.name}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p>วันที่จัดกิจกรรม</p>
            <p>{formatThaiDateTimeShort(new Date(data.event.date.start), new Date(data.event.date.end))}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p>สถานที่จัดกิจกรรม</p>
            <p>{data.event.place}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p>ผู้จัดกิจกรรม</p>
            <p>{data.event.host}</p>
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