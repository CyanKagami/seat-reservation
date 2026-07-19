<script lang='ts'>
    let {zoneNumber, chairType, color} = $props()
</script>
<a href="/reservation/zone" class="w-full h-auto">
{#if color === 'blue'}
<div class="bg-blue-400 h-12 text-center">
    <h1>{zoneNumber}</h1>
</div>
{:else if color === 'pink'}
<div class="bg-pink-400 h-12 text-center">
    <h1>{zoneNumber}</h1>
</div>
{:else}
<div class="bg-amber-400 h-12 text-center">
    <h1>{zoneNumber}</h1>
</div>
{/if}
</a>