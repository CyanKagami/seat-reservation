<script lang='ts'>
    import type { Place } from "$lib/type/place";
    const {place} : { place: Place } = $props()
</script>

<article class="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-xs transition-shadow hover:shadow-md">
    <div class="aspect-video w-full overflow-hidden bg-surface-subtle">
        <img class="h-full w-full object-cover" src={place.picture || "/image/defaultEvent.png"} alt={place.name}>
    </div>
    <div class="flex flex-1 flex-col p-4 sm:p-5">
        <h2 class="truncate text-xl font-bold text-dark sm:text-2xl">{place.name}</h2>
        <p class="mt-1 truncate text-sm font-semibold text-dark-muted">{place.location?.name || "ไม่ระบุสถานที่ตั้ง"}</p>
        {#if place.creatorName}
            <p class="mt-1 truncate text-sm text-dark-soft">{place.creatorName}</p>
        {/if}
        <a
            href={`/admin/places/${place.placeId}`}
            class="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
            จัดการสถานที่
        </a>
    </div>
</article>