<script lang='ts'>
  import Zone from "./Zone.svelte";
  import type { zone } from "$lib/type/zone";

    let colors = ['blue', 'pink', 'amber']
    let zones:zone[] = []
     for (let i = 1; i < 6; i++) {
    zones.push({
      'zoneNumber' : i,
      'chairType' : 'Cusion',
      'color' : colors[i % 3]
    });
  }
</script>
<div class="w-1/2 bg-gray-200 h-72 self-center mt-4 flex flex-col gap-5 px-10">
    {#each zones as z}
        <Zone zoneNumber={z.zoneNumber} chairType={z.chairType} color={z.color}></Zone>
    {/each}
</div>