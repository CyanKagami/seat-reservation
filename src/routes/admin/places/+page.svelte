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

    let isCreatePopupOpen = $state(false)
</script>
<div class="w-full max-w-6xl mx-auto mt-10 px-5">
    <h1 class="text-3xl font-semibold mb-5 text-center">สถานที่จัดงาน</h1>
    <div class="flex justify-between items-center">
        <!--Search bar-->
        <div>
            <p class="text-sm font-semibold">Search</p>
            <input class="rounded-lg w-96">
        </div>
        <button onclick={() => {isCreatePopupOpen = true}} class = "px-5 h-12 bg-secondary rounded-lg text-white hover:bg-secondary-hover hover:cursor-pointer">+ เพิ่มสถานที่</button>
    </div>

    <hr class="my-5 border-dim-gray">
        <!--content-->
    <!--Event Registration-->
        <div class="w-full flex flex-wrap gap-15 gap-y-10">
        {#each places as place }
            <PlaceBox place={place}></PlaceBox>
        {/each}
        </div>

    <!--Create Place Popup-->
    {#if isCreatePopupOpen}
    <div class="w-full h-full bg-black/50 fixed top-0 left-0 z-50 flex items-center justify-center">
        <div class="bg-white h-75 w-120 rounded-lg flex flex-col items-center p-7 gap-4">
            <p class="text-2xl font-semibold">เพิ่มสถานที่</p>
            <div class="w-full">
                <p>ชื่อสถานที่</p>
                <input name="name" class="w-full rounded-lg" required>
            </div>
            <div class="w-full">
                <p>สถานที่ตั้ง</p>
                <select name="location" class="w-full rounded-lg">
                    <option value="07">IT</option>
                </select>
            </div>
            <div class="w-full flex justify-between gap-3">
                <button class="w-1/2 border-2 border-black h-10 hover:bg-accent-hover hover:cursor-pointer rounded-lg" onclick={() => {isCreatePopupOpen = false}}>ยกเลิก</button>
                <button class="w-1/2 bg-accent h-10 hover:bg-accent-hover hover:cursor-pointer text-white rounded-lg">สร้าง</button>
            </div>
        </div>
    </div>
    {/if}
</div>