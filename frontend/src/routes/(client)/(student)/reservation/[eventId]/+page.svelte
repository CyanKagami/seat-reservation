<script lang="ts">
  import ProgressBar from "$lib/components/reservation/ProgressBar.svelte";
  import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
  import ReservationZonePicker from "$lib/components/zone-editor/components/ReservationZonePicker.svelte";
  import ZoneSeatPicker from "$lib/components/zone-editor/components/ZoneSeatPicker.svelte";
  import type { CanvasObject } from "$lib/components/canvas-shared/types";
  import { ApiError, getSeatMap, reserveSeat, type SeatMap } from "$lib/scripts/booking.js";
  import { onMount } from "svelte";
  import { getSeatId } from "$lib/components/zone-editor/utils/zoneUtils.js";
  import { alertModal } from "$lib/store/alert.svelte.js";
  import { goto } from "$app/navigation";

  let { data } = $props();

  // State: "zone", "seat", "confirm"
  let status = $state("zone");
  let zone = $state("");
  let seat = $state("");
  let reservationMap:SeatMap = $state({myReservation:null, reservations:[]})
  let reservedId: Record<string, Set<string>> = $derived.by(() => {
    let group = Object.groupBy(reservationMap.reservations, (s) => s.zone);
    let newGroup: Record<string, Set<string>> = {}
    for (var key in group) {
      let reservations = group[key];
      if (reservations) {
        newGroup[key] = new Set(reservations.map((s) => s.seat));
      }
    }
    return newGroup;
  })
  // State for right fixed sidebar and selected seats
  let selectedSeats = $state<CanvasObject[]>([]);

  async function pollForSeats(){
    try {
      reservationMap = await getSeatMap(data.event.eventId);
    }
    catch (err) {
      if (err instanceof ApiError) {
        console.log(err.message);
      }
    }
  }


  async function handleBooking(){
      let allSeat = [];
      for (let i = 0; i < selectedSeats.length; i++) {
          let seatId = getSeatId(selectedSeats[i])
        try {
          let {reservation} = await reserveSeat(data.event.eventId, seatId, zone);
          allSeat.push(reservation.seatId);
          alertModal.success("การจองสำเร็จ", "", () => {
              goto(`/event-info/${data.event.eventId}`)
          })
        }
        catch(err){
          if (err instanceof ApiError) {
            alertModal.failure("การจองล้มเหลว", err.message, () => {
              if (err.message === "ท่านมีที่นั่งอยู่แล้วในกิจกรรมนี้"){
                goto(`/event-info/${data.event.eventId}`)
              }
              else{
                status = "seat";
              }
            })
          }
        }
      }
      seat = allSeat.join(', ')
  }

  onMount(async () => {
    await pollForSeats();
    setInterval(() => {pollForSeats().catch(console.error)}, 10000)
  })
</script>

<div class="items-center flex flex-col gap-2 mt-10 px-4 pb-12">
  <h1 class="text-3xl font-semibold">{data.event.name}</h1>
  <ProgressBar status={status}></ProgressBar>

  {#if status === "zone"}
    <div class="w-full max-w-3xl bg-gray-200 h-auto py-10 self-center mt-4 flex flex-col gap-5 px-6 sm:px-10 rounded-xl">
      <ReservationZonePicker
        objects={data.seatState.objects}
        zone={data.seatState.zones}
        gridWidth={data.seatState.gridWidth}
        gridHeight={data.seatState.gridHeight}
        reservedIds={reservedId}
        onZoneSelect={(zoneId) => {
          zone = zoneId;
          status = "seat";
        }}
      ></ReservationZonePicker>
    </div>

  {:else if status === "seat"}
    <div class="w-full max-w-5xl mt-4">
      <!-- Main Seat Picker Canvas -->
      <div class="w-full bg-gray-200 p-4 sm:p-6 rounded-xl shadow-sm">
        <ZoneSeatPicker
          zoneName={zone}
          selectedZoneId={zone}
          maxSeats={1}
          objects={data.seatState.objects}
          reservedIds={reservedId[zone]}
          onBack={() => {
            status = "zone";
          }}
          onConfirm={(seats) => {
            selectedSeats = seats;
            status = "confirm"
            seat = seats.map((o) => getSeatId(o)).join(', ');
          }}
        ></ZoneSeatPicker>
      </div>
    </div>

  {:else}
    <!-- Summary View -->
    <div class="bg-gray-200 w-full max-w-2xl p-7 rounded-lg flex flex-col items-center gap-7 mt-4">
      <h1 class="font-semibold text-xl">สรุปข้อมูล</h1>
      <div class="w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div class="w-full md:w-1/2 flex flex-col justify-center items-center gap-2 text-sm">
          <div class="grid grid-cols-2 w-full">
            <p class="text-slate-600">กิจกรรม</p>
            <p class="font-medium">{data.event.name}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p class="text-slate-600">วันที่จัดกิจกรรม</p>
            <p class="font-medium">{formatThaiDateTimeShort(new Date(data.event.date.start), new Date(data.event.date.end))}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p class="text-slate-600">สถานที่จัดกิจกรรม</p>
            <p class="font-medium">{data.event.place.name}</p>
          </div>
          <div class="grid grid-cols-2 w-full">
            <p class="text-slate-600">ผู้จัดกิจกรรม</p>
            <p class="font-medium">{data.event.host}</p>
          </div>
          <div class="w-full my-4">
            <p class="text-lg font-semibold text-indigo-700">Zone {zone}, Seat {seat}</p>
          </div>
        </div>

        <div class="w-full md:w-1/2 flex items-center justify-center">
          <svg class="w-36 md:w-40" viewBox="0 0 385 370" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="320" y="169" width="65" height="141" rx="22" fill="#EA7B36"/>
            <rect y="169" width="65" height="141" rx="22" fill="#EA7B36"/>
            <rect x="33" width="320" height="311" rx="45" fill="#EA7B36"/>
            <rect x="38" y="198" width="309" height="81" fill="#D35D14"/>
            <rect x="19" y="251" width="348" height="119" rx="22" fill="#EA7B36"/>
            <rect x="28" y="314" width="328" height="50" rx="14" fill="#D35D14"/>
          </svg>
        </div>
      </div>
      <button onclick={handleBooking} class="w-full sm:w-70 p-3 bg-accent font-semibold text-white rounded-lg hover:opacity-95 transition cursor-pointer text-center">
        Confirm
      </button>
    </div>
  {/if}
</div>