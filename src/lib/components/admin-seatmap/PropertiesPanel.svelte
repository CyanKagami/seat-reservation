<script lang="ts">
  import {
    SEAT_STATUS_LABELS,
    CHAIR_TYPES,
    type SeatStatus,
    type SeatProps,
  } from './types';

  interface Props {
    /** Currently selected seat props (null = no seat selected / multiple mixed) */
    seatProps: SeatProps | null;
    /** How many seats are in the selection */
    selectionCount: number;
    onUpdate: (props: SeatProps) => void;
  }

  let { seatProps, selectionCount, onUpdate }: Props = $props();

  // Local editable copy; syncs whenever props change
  let localProps = $state<SeatProps>({
    status: 'available',
    chairType: 'Standard',
    description: '',
  });

  $effect(() => {
    if (seatProps) {
      localProps = { ...seatProps };
    }
  });

  function commit() {
    onUpdate({ ...localProps });
  }
</script>

<aside class="flex flex-col gap-4 p-4 bg-white border-l border-gray-200 w-[200px] shrink-0">
  {#if selectionCount === 0}
    <p class="text-xs text-gray-400 text-center mt-8">
      เลือกเก้าอี้เพื่อดูข้อมูล
    </p>
  {:else if !seatProps}
    <p class="text-xs text-gray-500 text-center mt-8">
      เลือกเก้าอี้ {selectionCount} ตัว<br />
      <span class="text-gray-400">(มีหลายชนิด)</span>
    </p>
  {:else}
    <!-- Status dropdown -->
    <div class="flex flex-col gap-1">
      <label for="seat-status" class="text-xs font-medium text-gray-600">
        สถานะเก้าอี้
      </label>
      <select
        id="seat-status"
        bind:value={localProps.status}
        onchange={commit}
        class="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white
               focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      >
        {#each Object.entries(SEAT_STATUS_LABELS) as [value, label]}
          <option value={value as SeatStatus}>{label}</option>
        {/each}
      </select>
    </div>

    <!-- Chair type dropdown -->
    <div class="flex flex-col gap-1">
      <label for="chair-type" class="text-xs font-medium text-gray-600">
        ลักษณะเก้าอี้
      </label>
      <select
        id="chair-type"
        bind:value={localProps.chairType}
        onchange={commit}
        class="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white
               focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      >
        {#each CHAIR_TYPES as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
    </div>

    <!-- Description textarea -->
    <div class="flex flex-col gap-1">
      <label for="seat-desc" class="text-xs font-medium text-gray-600">
        หมายเหตุ
      </label>
      <textarea
        id="seat-desc"
        bind:value={localProps.description}
        onblur={commit}
        rows={3}
        placeholder="รายละเอียดเพิ่มเติม..."
        class="text-xs border border-gray-300 rounded-md px-2 py-1.5 resize-none
               focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      ></textarea>
    </div>

    <!-- Status colour legend -->
    <div class="mt-auto flex flex-col gap-1.5 pt-3 border-t border-gray-100">
      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
        ตำนานสี
      </p>
      {#each Object.entries(SEAT_STATUS_LABELS) as [status, label]}
        <div class="flex items-center gap-2">
          <span
            class="w-4 h-4 rounded-sm border shrink-0"
            style="background:{status === 'available'
              ? '#d1fae5'
              : status === 'unavailable'
              ? '#fee2e2'
              : '#fef3c7'};
            border-color:{status === 'available'
              ? '#6ee7b7'
              : status === 'unavailable'
              ? '#fca5a5'
              : '#fcd34d'}"
          ></span>
          <span class="text-[11px] text-gray-600">{label}</span>
        </div>
      {/each}
    </div>
  {/if}
</aside>
