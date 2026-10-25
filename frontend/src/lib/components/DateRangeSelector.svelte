<!-- CalendarDateTimeRange.svelte -->
<script lang="ts">
  import { clickOutside } from "$lib/actions/ClickOutside";

  interface DateTimeRange {
    start: Date;
    end: Date;
  }

  let {
    value = $bindable<DateTimeRange>({
      start: new Date(),
      end: new Date(Date.now() + 86400000 * 3)
    }),
    onApply = (range: DateTimeRange) => {}
  } = $props();

  // Internal component states
  let isOpen = $state(false);
  let viewDate = $state(new Date(value.start || Date.now()));
  
  let selectedStart = $state<Date | null>(value.start);
  let selectedEnd = $state<Date | null>(value.end);
  let hoverDate = $state<Date | null>(null);

  let startTime = $state(formatTime(value.start));
  let endTime = $state(formatTime(value.end));

  $effect(() => {
    if (isOpen) {
      selectedStart = value.start;
      selectedEnd = value.end;
      startTime = formatTime(value.start);
      endTime = formatTime(value.end);
      if (value.start) {
        viewDate = new Date(value.start);
      }
    }
  });

  // Helpers
  function formatTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function isSameDay(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Calendar Grid Generation ($derived)
  let calendarDays = $derived.by(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    // Padding for previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    // Padding for next month
    const totalCells = Math.ceil(grid.length / 7) * 7;
    for (let i = 1; grid.length < totalCells; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return grid;
  });

  // Derived effective end date (for hover preview)
  let effectiveEnd = $derived(
    selectedEnd || (selectedStart && hoverDate && hoverDate >= selectedStart ? hoverDate : null)
  );

  let isRangeValid = $derived.by(() => {
    if (!selectedStart || !selectedEnd) return false;
    const finalStart = combineDateAndTime(selectedStart, startTime);
    const finalEnd = combineDateAndTime(selectedEnd, endTime);
    return finalStart <= finalEnd;
  });

  let displayLabel = $derived.by(() => {
    if (!value.start || !value.end) return 'Select date & time range';
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return `${value.start.toLocaleString([], opts)} – ${value.end.toLocaleString([], opts)}`;
  });

  // Range logic
  function handleDayClick(dayDate: Date) {
    if (!selectedStart || (selectedStart !== selectedEnd)) {
      selectedStart = dayDate;
      selectedEnd = dayDate;
    } else if (selectedStart === selectedEnd) {
      if (dayDate < selectedStart) {
        selectedStart = dayDate;
      } else {
        selectedEnd = dayDate;
      }
    }
  }

  function combineDateAndTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours || 0, minutes || 0, 0, 0);
    return result;
  }

  function changeMonth(offset: number) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
  }

  function handleApply() {
    if (selectedStart && selectedEnd && isRangeValid) {
      value = {
        start: combineDateAndTime(selectedStart, startTime),
        end: combineDateAndTime(selectedEnd, endTime)
      };
      onApply(value);
      isOpen = false;
    }
  }

  function isWithinRange(date: Date): boolean {
    if (!selectedStart || !effectiveEnd) return false;
    const t = date.getTime();
    return t > selectedStart.getTime() && t < effectiveEnd.getTime();
  }

</script>

<div use:clickOutside onclickoutside={() => (isOpen = false)} class="relative inline-block text-left font-sans text-sm w-full">
  <!-- Trigger Button -->
  <button
    type="button"
    onclick={() => (isOpen = !isOpen)}
    class="w-full flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
  >
    <svg class="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <span class="truncate">{displayLabel}</span>
  </button>

  <!-- Calendar Popover (Mobile Fullscreen below h-20, Desktop absolute popup) -->
  {#if isOpen}
    <div 
      class="fixed inset-x-0 top-20 bottom-0 z-50 flex flex-col justify-between overflow-y-auto bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/5 
             sm:absolute sm:top-auto sm:bottom-auto sm:left-0 sm:right-auto sm:inset-x-auto sm:mt-2 sm:w-[340px] sm:h-auto sm:rounded-2xl sm:border sm:border-slate-100"
    >
      <div class="flex flex-col">
        <!-- Calendar Header -->
        <div class="mb-4 flex items-center justify-between px-1">
          <button
            type="button"
            onclick={() => changeMonth(-1)}
            class="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <svg class="h-5 w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="font-semibold text-slate-800 text-base sm:text-sm">
            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onclick={() => changeMonth(1)}
            class="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <svg class="h-5 w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- Weekday Labels -->
        <div class="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-400">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>

        <!-- Calendar Days Grid -->
        <div class="grid grid-cols-7 gap-y-1">
          {#each calendarDays as { date, isCurrentMonth }}
            {@const isStart = isSameDay(date, selectedStart)}
            {@const isEnd = isSameDay(date, effectiveEnd)}
            {@const inRange = isWithinRange(date)}

            <div
              class="relative flex h-10 sm:h-9 items-center justify-center
              {inRange ? 'bg-secondary/10' : ''}
              {isStart && effectiveEnd ? 'rounded-l-full bg-secondary/10' : ''}
              {isEnd && selectedStart ? 'rounded-r-full bg-secondary/10' : ''}"
            >
              <button
                type="button"
                onclick={() => handleDayClick(date)}
                onmouseenter={() => (hoverDate = date)}
                onmouseleave={() => (hoverDate = null)}
                class="h-9 w-9 sm:h-8 sm:w-8 rounded-full text-xs font-medium transition-all
                {!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                {isStart || isEnd ? '!bg-secondary !text-white shadow-md' : 'hover:bg-slate-100'}
                {inRange ? 'font-semibold text-secondary' : ''}"
              >
                {date.getDate()}
              </button>
            </div>
          {/each}
        </div>

        <!-- Time Pickers Section -->
        <div class="mt-4 border-t border-slate-100 pt-3">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="flex flex-col gap-1">
              <span class="font-medium text-slate-500">Start Time</span>
              <input
                type="time"
                bind:value={startTime}
                class="rounded-lg border border-slate-200 px-2 py-2 sm:py-1 text-slate-800 focus:border-secondary focus:outline-none"
              />
            </div>
            <div class="flex flex-col gap-1">
              <span class="font-medium text-slate-500">End Time</span>
              <input
                type="time"
                bind:value={endTime}
                class="rounded-lg border border-slate-200 px-2 py-2 sm:py-1 text-slate-800 focus:border-secondary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onclick={() => (isOpen = false)}
          class="w-full sm:w-auto rounded-xl sm:rounded-lg px-4 sm:px-3 py-3 sm:py-1.5 text-sm sm:text-xs font-semibold sm:font-medium text-slate-600 bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 transition-colors cursor-pointer text-center"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!selectedStart || !selectedEnd || !isRangeValid}
          onclick={handleApply}
          class="w-full sm:w-auto rounded-xl sm:rounded-lg bg-secondary px-5 sm:px-3.5 py-3 sm:py-1.5 text-sm sm:text-xs font-semibold sm:font-medium text-white shadow-sm transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
        >
          Apply
        </button>
      </div>

    </div>
  {/if}
</div>