<script lang='ts'>
    const {event} = $props()
</script>

<div class="w-96 h-84 border border-gray-400 rounded-lg">
    <div class="w-full h-40">
        <img class="object-cover w-full h-full" src={event.picture} alt={event.name}>
    </div>
    <div class="p-5">
        <h1 class="text-2xl font-semibold">{event.name}</h1>
        <p class="text-sm font-semibold">{event.date}:{event.place}</p>
        <p class="text-sm text-gray-400">{event.host}</p>
        <button class="bg-accent w-full py-2 rounded-xl text-white font-semibold mt-3 text-lg">Register</button>
    </div>
</div>