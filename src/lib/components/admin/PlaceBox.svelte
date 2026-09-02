<script lang='ts'>
    import type { Place } from "$lib/type/place";
    const {place} : { place: Place } = $props()
</script>

<div class="w-96 h-84 border border-gray-400 rounded-lg">
    <div class="w-full h-40">
        <img class="object-cover w-full h-full" src={place.picture} alt={place.name}>
    </div>
    <div class="p-5">
        <h1 class="text-2xl font-semibold">{place.name}</h1>
        <p class="text-sm font-semibold">{place.location}</p>
        <p class="text-sm text-gray-400">{place.creatorName}</p>
        <a href={`/admin/places/${place.placeId}`}>
            <button class="bg-accent w-full py-2 rounded-xl text-white font-semibold mt-3 text-lg hover:cursor-pointer hover:bg-accent-hover transition-colors duration-200">
                จัดการ
            </button>
        </a>
    </div>
</div>