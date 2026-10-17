<script lang="ts">
  import Seat from "$lib/components/Seat.svelte";
  import type { Seat as seat } from "$lib/type/seat";

  let seats: seat[] = $state([]);
  let selectedSeat = -1;

  for (let i = 1; i < 6; i++) {
    seats.push({
      position: i,
      isReserve: i % 2 ? true : false,
      selected: false,
    });
  }

  function reserve(index: number) {
    console.log(index);
    if (selectedSeat === index) {
      seats[selectedSeat].selected = false;
      selectedSeat = -1;
      return;
    }
    if (selectedSeat != -1) {
      seats[selectedSeat].selected = false;
    }
    seats[index].selected = true;
    selectedSeat = index;
  }
</script>

<div class="w-1/2 bg-gray-200 h-72 self-center mt-4 flex gap-5">
  {#each seats as seat, i}
    <Seat
      index={i}
      position={seat.position}
      isReserve={seat.isReserve}
      selected={seat.selected}
      handler={reserve}
    ></Seat>
  {/each}
</div>

<a href="/" class="justify-center items-center flex">
  <button class="rounded-xl bg-pink-500 w-24 h-12 self-center mt-5 text-white">
    จับจอง
  </button>
</a>