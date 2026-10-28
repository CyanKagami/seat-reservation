<script lang="ts">
  import ProgressBar from "$lib/components/reservation/ProgressBar.svelte";
  import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
  import ReservationZonePicker from "$lib/components/zone-editor/components/ReservationZonePicker.svelte";
  import ZoneSeatPicker from "$lib/components/zone-editor/components/ZoneSeatPicker.svelte";
  import type { CanvasObject } from "$lib/components/canvas-shared/types";
  import { getSeatMap, reserveSeat, type SeatMap } from "$lib/scripts/booking.js";
  import { ApiError } from "$lib/scripts/api.js";
  import { onMount } from "svelte";
  import { getSeatId } from "$lib/components/zone-editor/utils/zoneUtils.js";
  import { alertModal } from "$lib/store/alert.svelte.js";
  import { goto } from "$app/navigation";

  let { data } = $props();

  // State: "zone", "seat", "confirm"
  let status = $state("zone");
  let zone = $state("");
  let seat = $state("");
  let isSubmitting = $state(false);
  let hasLoadedSeatMap = $state(false);
  let reservationMap: SeatMap = $state({ myReservation: null, reservations: [] });
  let hasExistingReservation = $derived(reservationMap.myReservation !== null);

  let reservedId: Record<string, Set<string>> = $derived.by(() => {
    let group = Object.groupBy(reservationMap.reservations, (s) => s.zone);
    let newGroup: Record<string, Set<string>> = {};
    for (var key in group) {
      let reservations = group[key];
      if (reservations) {
        newGroup[key] = new Set(reservations.map((s) => s.seat));
      }
    }
    return newGroup;
  });

  let myReservedId: Record<string, Set<string>> = $derived.by(() => {
    let group = Object.groupBy(
      reservationMap.reservations.filter((reservation) => reservation.mine),
      (reservation) => reservation.zone
    );
    let newGroup: Record<string, Set<string>> = {};
    for (var key in group) {
      let reservations = group[key];
      if (reservations) {
        newGroup[key] = new Set(reservations.map((reservation) => reservation.seat));
      }
    }
    return newGroup;
  });

  let selectedSeats = $state<CanvasObject[]>([]);
  let existingReservationSeat = $derived.by(() => {
    const reservation = reservationMap.myReservation;
    if (!reservation) return null;
    const reservedSeat = data.seatState.objects.find(
      (object) =>
        object.type === "seat" &&
        object.metadata?.zone === reservation.zone &&
        getSeatId(object) === reservation.seat
    );
    return {
      id: reservedSeat?.id ?? `${reservation.zone}-${reservation.seat}`,
      zone: reservation.zone,
      seatId: reservation.seat,
      seatTypeKey: reservedSeat?.metadata?.seatType ?? "standard"
    };
  });
  let confirmationSeats = $derived(selectedSeats.map((selectedSeat) => ({
      id: selectedSeat.id,
      zone,
      seatId: getSeatId(selectedSeat),
      seatTypeKey: selectedSeat.metadata?.seatType ?? "standard"
    })));

  async function pollForSeats() {
    try {
      reservationMap = await getSeatMap(data.event.eventId);
    } catch {
      // Seat availability refreshes periodically; avoid interrupting the user with repeated dialogs.
    } finally {
      hasLoadedSeatMap = true;
    }
  }

  async function handleBooking() {
    if (isSubmitting) return;
    isSubmitting = true;
    let allSeat = [];
    for (let i = 0; i < selectedSeats.length; i++) {
      let seatId = getSeatId(selectedSeats[i]);
      try {
        let { reservation } = await reserveSeat(data.event.eventId, seatId, zone);
        allSeat.push(reservation.seatId);
        alertModal.success("การจองสำเร็จ", "คุณได้ทำการจองที่นั่งเรียบร้อยแล้ว", () => {
          goto(`/event-info/${data.event.eventId}`);
        });
      } catch (err) {
        if (err instanceof ApiError) {
          alertModal.failure("การจองล้มเหลว", err.message, () => {
            if (err.message === "ท่านมีที่นั่งอยู่แล้วในกิจกรรมนี้") {
              goto(`/event-info/${data.event.eventId}`);
            } else {
              status = "seat";
            }
          });
        }
      } finally {
        isSubmitting = false;
      }
    }
    seat = allSeat.join(', ');
  }

  onMount(() => {
    pollForSeats();
    const interval = setInterval(() => {
      pollForSeats().catch(console.error);
    }, 10000);
    return () => clearInterval(interval);
  });
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col items-center">
  <!-- Event Header Title -->
  <div class="text-center max-w-2xl mb-20">
    <h1 class="text-2xl sm:text-3xl font-bold text-dark tracking-tight">
      {data.event.name}
    </h1>
  </div>

  {#if hasLoadedSeatMap && !hasExistingReservation}
    <!-- Interactive Stepper -->
    <ProgressBar {status} />
  {/if}

  {#if !hasLoadedSeatMap}
    <div class="w-full max-w-xl rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-xs">
      <span class="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-accent"></span>
      <p class="mt-3 text-sm text-dark-soft">กำลังตรวจสอบข้อมูลการจอง...</p>
    </div>
  {:else if hasExistingReservation}
    <div class="w-full max-w-xl bg-white rounded-2xl border border-border-subtle shadow-xs p-6 sm:p-8 flex flex-col gap-6">
      <div class="text-center pb-4 border-b border-border-subtle">
        <h2 class="text-xl font-bold text-dark">คุณได้จองที่นั่งแล้ว</h2>
        <p class="text-xs text-dark-soft mt-1">รายละเอียดที่นั่งที่คุณจองไว้</p>
      </div>

      <div class="bg-surface-subtle rounded-xl p-5 space-y-3.5 text-sm">
        <div class="flex items-start justify-between gap-4">
          <span class="text-dark-soft shrink-0">กิจกรรม</span>
          <span class="font-semibold text-dark text-right">{data.event.name}</span>
        </div>
        <div class="flex items-start justify-between gap-4">
          <span class="text-dark-soft shrink-0">วันและเวลากิจกรรม</span>
          <span class="font-medium text-dark text-right">{formatThaiDateTimeShort(new Date(data.event.date.start), new Date(data.event.date.end))}</span>
        </div>

        {#if existingReservationSeat}
          {@const seatTypeKey = existingReservationSeat.seatTypeKey}
          {@const seatType = data.seatState.seatTypes[seatTypeKey] ?? {
            name: seatTypeKey,
            color: "#e2e8f0"
          }}
          <div class="pt-3 border-t border-border-subtle space-y-3">
            <span class="text-dark-soft font-medium">ที่นั่งที่เลือก</span>
            <div class="flex items-center gap-3 rounded-lg border border-border-subtle bg-white p-3">
              {#if seatType.picture}
                <img
                  src={seatType.picture}
                  alt={`รูปภาพประเภทที่นั่ง ${seatType.name}`}
                  class="h-14 w-14 shrink-0 rounded-md border border-border-subtle object-cover"
                />
              {/if}
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-secondary">
                  โซน {existingReservationSeat.zone} · ที่นั่ง {existingReservationSeat.seatId}
                </p>
                <p class="mt-0.5 text-sm font-semibold text-dark">{seatType.name}</p>
                {#if seatType.description}
                  <p class="mt-1 text-xs text-dark-soft">{seatType.description}</p>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <button
        type="button"
        onclick={() => goto(`/event-info/${data.event.eventId}`)}
        class="w-full py-3 px-4 rounded-xl bg-surface-subtle text-dark font-semibold text-sm hover:bg-border-subtle transition-colors cursor-pointer"
      >
        กลับไปหน้ากิจกรรม
      </button>
    </div>
  <!-- STEP 1: ZONE PICKER -->
  {:else if status === "zone"}
    <div class="w-full max-w-4xl bg-white rounded-2xl border border-border-subtle shadow-xs p-6 sm:p-8 flex flex-col gap-6">
      <div class="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <h2 class="text-lg font-bold text-dark">เลือกโซนที่นั่ง</h2>
          <p class="text-xs sm:text-sm text-dark-soft mt-0.5">คลิกที่โซนที่คุณต้องการนั่งบนผังสถานที่</p>
        </div>
      </div>

      <div class="w-full bg-surface-subtle/60 rounded-xl p-4 flex justify-center items-center overflow-auto border border-border-subtle">
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
        />
      </div>
    </div>

  <!-- STEP 2: SEAT PICKER -->
  {:else if status === "seat"}
    <div class="w-full max-w-5xl bg-white rounded-2xl border border-border-subtle shadow-xs p-6 sm:p-8 flex flex-col gap-6">
      <div class="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <h2 class="text-lg font-bold text-dark">เลือกที่นั่งในโซน: {zone}</h2>
          <p class="text-xs sm:text-sm text-dark-soft mt-0.5">เลือกที่นั่งที่คุณต้องการ (สูงสุด 1 ที่นั่งต่อบัญชี)</p>
        </div>
        <button
          type="button"
          onclick={() => status = "zone"}
          class="px-3.5 py-1.5 rounded-lg border border-border-strong text-xs font-semibold text-dark hover:bg-surface-subtle transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span>เปลี่ยนโซน</span>
        </button>
      </div>

      <div class="w-full bg-surface-subtle/60 rounded-xl p-4 flex justify-center items-center overflow-auto border border-border-subtle">
        <ZoneSeatPicker
          zoneName={zone}
          selectedZoneId={zone}
          maxSeats={1}
          objects={data.seatState.objects}
          seatTypes={data.seatState.seatTypes}
          reservedIds={reservedId[zone]}
          myReservedIds={myReservedId[zone]}
          onBack={() => {
            status = "zone";
          }}
          onConfirm={(seats) => {
            selectedSeats = seats;
            status = "confirm";
            seat = seats.map((o) => getSeatId(o)).join(', ');
          }}
        />
      </div>
    </div>

  <!-- STEP 3: CONFIRMATION SUMMARY -->
  {:else}
    <div class="w-full max-w-xl bg-white rounded-2xl border border-border-subtle shadow-xs p-6 sm:p-8 flex flex-col gap-6">
      <div class="text-center pb-4 border-b border-border-subtle">
        <h2 class="text-xl font-bold text-dark">สรุปข้อมูลการจองที่นั่ง</h2>
        <p class="text-xs text-dark-soft mt-1">
          กรุณาตรวจสอบข้อมูลก่อนกดยืนยันการจอง
        </p>
      </div>

      <div class="bg-surface-subtle rounded-xl p-5 space-y-3.5 text-sm">
        <div class="flex items-start justify-between gap-4">
          <span class="text-dark-soft shrink-0">กิจกรรม</span>
          <span class="font-semibold text-dark text-right">{data.event.name}</span>
        </div>
        <div class="flex items-start justify-between gap-4">
          <span class="text-dark-soft shrink-0">วันและเวลากิจกรรม</span>
          <span class="font-medium text-dark text-right">{formatThaiDateTimeShort(new Date(data.event.date.start), new Date(data.event.date.end))}</span>
        </div>
        <div class="flex items-start justify-between gap-4">
          <span class="text-dark-soft shrink-0">สถานที่</span>
          <span class="font-medium text-dark text-right">{data.event.place.name}</span>
        </div>
        <div class="flex items-start justify-between gap-4">
          <span class="text-dark-soft shrink-0">ผู้จัด</span>
          <span class="font-medium text-dark text-right">{data.event.host}</span>
        </div>

        <div class="pt-3 border-t border-border-subtle space-y-3">
          <span class="text-dark-soft font-medium">ที่นั่งที่เลือก</span>
          <div class="space-y-2">
            {#each confirmationSeats as selectedSeat (selectedSeat.id)}
              {@const seatTypeKey = selectedSeat.seatTypeKey}
              {@const seatType = data.seatState.seatTypes[seatTypeKey] ?? {
                name: seatTypeKey,
                color: "#e2e8f0"
              }}
              <div class="flex items-center gap-3 rounded-lg border border-border-subtle bg-white p-3">
                {#if seatType.picture}
                  <img
                    src={seatType.picture}
                    alt={`รูปภาพประเภทที่นั่ง ${seatType.name}`}
                    class="h-14 w-14 shrink-0 rounded-md border border-border-subtle object-cover"
                  />
                {/if}
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold text-secondary">
                    โซน {selectedSeat.zone} · ที่นั่ง {selectedSeat.seatId}
                  </p>
                  <p class="mt-0.5 text-sm font-semibold text-dark">{seatType.name}</p>
                  {#if seatType.description}
                    <p class="mt-1 text-xs text-dark-soft">{seatType.description}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onclick={() => status = "seat"}
          class="flex-1 py-3 px-4 rounded-xl border border-border-strong text-dark font-semibold text-sm hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          กลับไปแก้ไข
        </button>
        <button
          type="button"
          onclick={handleBooking}
          disabled={isSubmitting}
          class="flex-1 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
        >
          {#if isSubmitting}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>กำลังบันทึก...</span>
          {:else}
            <span>ยืนยันการจองที่นั่ง</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
