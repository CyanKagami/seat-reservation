<script lang="ts">
  import ZoneChoosing from "$lib/components/ZoneChoosing.svelte";
  import ProgressBar from "$lib/components/reservation/ProgressBar.svelte";
  import EventRoom from "$lib/components/EventRoom.svelte";
  import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";
  import ReservationZonePicker from "$lib/components/zone-editor/components/ReservationZonePicker.svelte";
  import ZoneSeatPicker from "$lib/components/zone-editor/components/ZoneSeatPicker.svelte";
  import type { CanvasObject } from "$lib/components/seat-editor/types";

  let { data } = $props();

  // State: "zone", "seat", "confirm"
  let status = $state("zone");
  let zone = $state("Z1");
  let seat = $state("D2");

  // State for right fixed sidebar and selected seats
  let selectedSeats = $state<CanvasObject[]>([]);
  let showSidebar = $state(false);

  // Derived total price calculation from seat metadata
  let totalPrice = $derived(
    selectedSeats.reduce((sum, s) => sum + Number(s.metadata?.price ?? 0), 0)
  );
</script>

<div class="items-center flex flex-col gap-2 mt-10 px-4 pb-12">
  <h1 class="text-3xl font-semibold">{data.event.name}</h1>
  <ProgressBar status={status}></ProgressBar>

  {#if status === "zone"}
    <div class="w-full max-w-3xl bg-gray-200 h-auto py-10 self-center mt-4 flex flex-col gap-5 px-6 sm:px-10 rounded-xl">
      <ReservationZonePicker 
        objects={data.seatState.objects} 
        zone={data.seatState.zones} 
        onZoneSelect={(zoneId) => {
          zone = zoneId; 
          status = "seat";
          showSidebar = false;
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
          objects={data.seatState.objects} 
          onBack={() => {
            status = "zone";
            showSidebar = false;
          }}
          onConfirm={(seats) => {
            selectedSeats = seats;
            showSidebar = true;
          }}
        ></ZoneSeatPicker>
      </div>
    </div>

    <!-- ================= FIXED RIGHT SIDEBAR ================= -->
    {#if showSidebar}
      <!-- Backdrop Overlay -->
      <div 
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onclick={() => (showSidebar = false)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Escape' && (showSidebar = false)}
      ></div>

      <!-- Slide-Over Sidebar Panel -->
      <aside class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        <!-- Sidebar Header -->
        <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 class="font-bold text-slate-800 text-base sm:text-lg">สรุปการเลือกที่นั่ง</h2>
            <p class="text-xs text-slate-500">
              Zone <span class="font-semibold text-slate-700">{zone}</span> • เลือก {selectedSeats.length} ที่นั่ง
            </p>
          </div>

          <button 
            onclick={() => (showSidebar = false)}
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            aria-label="Close Sidebar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable Vertical Seat List with Metadata -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
          {#if selectedSeats.length === 0}
            <div class="text-center py-12 text-slate-400 text-sm">
              ไม่มีที่นั่งที่ถูกเลือก
            </div>
          {:else}
            {#each selectedSeats as s (s.id)}
              <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5 shadow-xs transition hover:border-indigo-300">
                
                <!-- Seat Card Header -->
                <div class="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span class="font-bold text-slate-800 text-sm">
                      ที่นั่ง: {s.metadata?.label || s.metadata?.seatNo || s.id.replace('seat_', '')}
                    </span>
                  </div>
                  
                  {#if s.metadata?.status}
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {s.metadata.status}
                    </span>
                  {/if}
                </div>

                <!-- Seat Detailed Metadata -->
                <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-slate-400">โซน (Zone):</span>
                    <span class="font-semibold text-slate-700">{s.metadata?.zone || zone}</span>
                  </div>

                  {#if s.metadata?.row}
                    <div class="flex justify-between">
                      <span class="text-slate-400">แถว (Row):</span>
                      <span class="font-semibold text-slate-700">{s.metadata.row}</span>
                    </div>
                  {/if}

                  {#if s.metadata?.type}
                    <div class="flex justify-between">
                      <span class="text-slate-400">ประเภท (Type):</span>
                      <span class="font-semibold text-slate-700">{s.metadata.type}</span>
                    </div>
                  {/if}

                  {#if s.metadata?.price !== undefined}
                    <div class="flex justify-between col-span-2 pt-1 mt-1 border-t border-slate-200/60">
                      <span class="text-slate-500 font-medium">ราคา (Price):</span>
                      <span class="font-bold text-indigo-700">฿{Number(s.metadata.price).toLocaleString()}</span>
                    </div>
                  {/if}

                  <!-- Render any other custom metadata properties -->
                  {#each Object.entries(s.metadata || {}) as [key, val]}
                    {#if !['label', 'seatNo', 'status', 'row', 'zone', 'type', 'price'].includes(key) && typeof val !== 'object'}
                      <div class="flex justify-between col-span-2">
                        <span class="text-slate-400 capitalize">{key}:</span>
                        <span class="font-medium text-slate-700">{String(val)}</span>
                      </div>
                    {/if}
                  {/each}
                </div>

              </div>
            {/each}
          {/if}
        </div>

        <!-- Sidebar Footer Action Section -->
        <div class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 shrink-0">
          {#if totalPrice > 0}
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500 font-medium">ราคารวมทั้งสิ้น:</span>
              <span class="text-lg font-bold text-indigo-600">฿{totalPrice.toLocaleString()}</span>
            </div>
          {/if}

          <button 
            onclick={() => {
              if (selectedSeats.length > 0) {
                seat = selectedSeats.map(s => s.metadata?.label || s.metadata?.seatNo || s.id).join(", ");
              }
              showSidebar = false;
              status = "confirm";
            }}
            class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>ดำเนินการจองที่นั่ง ({selectedSeats.length})</span>
            <svg class="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

      </aside>
    {/if}

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
      <button class="w-full sm:w-70 p-3 bg-accent font-semibold text-white rounded-lg hover:opacity-95 transition cursor-pointer">
        Confirm
      </button>
    </div>
  {/if}
</div>