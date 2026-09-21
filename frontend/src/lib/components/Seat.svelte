<script lang='ts'>
    let {position, isReserve, selected, handler, index} = $props()

</script>

{#if isReserve}
<button class="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-400 ">
    <p>{position}</p>
</button>
{:else}
<button class="w-12 h-12 rounded-xl flex items-center justify-center {selected ? "bg-pink-500" : "bg-blue-400"} "
    onclick={() => handler(index)}>
    <p>{position}</p>
</button>
{/if}