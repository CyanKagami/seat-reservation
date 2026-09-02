<script lang="ts">
    import PlaceBox from "$lib/components/admin/PlaceBox.svelte"
    import type { Place } from "$lib/type/place";
    import { onMount } from "svelte";
    let places: Place[] = $state([])
    onMount(async () => {
        await fetch("/api/place", {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((data) => {
            places = data.body.data;
        })
    })
</script>
<div class="w-full max-w-6xl mx-auto mt-10 px-5">
    <h1 class="text-3xl font-semibold mb-5 text-center">สถานที่จัดงาน</h1>
    <!--Search bar-->
        <div>
            <p class="text-sm font-semibold">Search</p>
            <input class="rounded-lg w-96">
        </div>
    <hr class="my-5 border-dim-gray">
        <!--content-->
    <!--Event Registration-->
        <div class="w-full flex flex-wrap gap-15 gap-y-10">
        {#each places as place }
            <PlaceBox place={place}></PlaceBox>
        {/each}
        </div>
</div>