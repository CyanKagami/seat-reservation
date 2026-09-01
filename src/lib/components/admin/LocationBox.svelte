<script lang='ts'>
    import { setContext, untrack } from "svelte";

    const date = untrack(()=>event.date)
    const start_date = new Date(date.start)
    const end_date = new Date(date.end)

</script>

<div class="w-96 h-84 border border-gray-400 rounded-lg">
    <div class="w-full h-40">
        <img class="object-cover w-full h-full" src={event.picture} alt={event.name}>
    </div>
    <div class="p-5">
        <h1 class="text-2xl font-semibold">{event.name}</h1>
        <p class="text-sm font-semibold">{event.place}</p>
        <p class="text-sm text-gray-400">{event.host}</p>
        <a href="/event-info/1">
            <button class="bg-accent w-full py-2 rounded-xl text-white font-semibold mt-3 text-lg hover:cursor-pointer hover:bg-accent-hover transition-colors duration-200">Event Information</button>
        </a>

    </div>
</div>