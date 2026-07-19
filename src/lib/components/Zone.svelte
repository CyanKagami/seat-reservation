<script lang='ts'>
    let {zoneNumber, chairType, color} = $props()
</script>

{#if color === 'blue'}
<div class="bg-blue-400 w-56 h-24">
    <h1>{zoneNumber}</h1>
</div>
{:else if color === 'pink'}
<div class="bg-pink-400 w-56 h-24">
    <h1>{zoneNumber}</h1>
</div>
{:else}
<div class="bg-amber-400 w-56 h-24">
    <h1>{zoneNumber}</h1>
</div>
{/if}