<script lang='ts'>
  import { invalidate, refreshAll } from '$app/navigation';
  import { checkInSeat } from '$lib/scripts/booking.js';

    const {data, params} = $props();
    let checkInCount = $derived(data.eventSeatMap.reservations.reduce((p, res) => {return (res.status === 'checked-in') ? p + 1 : p}, 0))
    let totalCount = $derived(data.eventSeatMap.reservations.length)
    const percentage = $derived((checkInCount / totalCount) * 100)
    let identifier: string = $state('');

    async function handleSubmit() {
        let result = await checkInSeat(params.eventId, identifier);
        invalidate(`/booking?eventId=${encodeURIComponent(params.eventId)}`)
    }

    $effect(()=> {
        console.log(data.eventSeatMap)
    })
</script>
<div class="flex flex-col items-center mt-5 w-3/4 self-center p-5 pt-12">
    <h1 class="text-4xl font-semibold mb-10">ข้อมูลการเข้าร่วมกิจกรรม</h1>
    <div class="w-full bg-gray-200 rounded-lg h-52 grid grid-cols-3 p-10 gap-5">
        <div class="col-span-2 bg-white rounded-lg border border-accent h-full w-ful flex gap-3">
            <div class="bg-accent px-7 h-full rounded-l-lg flex items-center justify-center w-fit">
                <svg class="w-20 h-20 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-464a208 208 0 1 0 0 416 208 208 0 1 0 0-416zm70.7 121.9c7.8-10.7 22.8-13.1 33.5-5.3 10.7 7.8 13.1 22.8 5.3 33.5L243.4 366.1c-4.1 5.7-10.5 9.3-17.5 9.8-7 .5-13.9-2-18.8-6.9l-55.9-55.9c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l36 36 105.6-145.2z"/></svg>
            </div>
            <div class="bg-white p-5 text-left flex flex-col gap-2">
                <p class="text-base">เข้าร่วมงานแล้ว</p>
                <p class="text-4xl">{checkInCount} คน</p>
            </div>
            <div class="w-0.5 bg-black my-5"></div>
            <div class="bg-white p-5 text-left flex flex-col gap-2">
                <p class="text-base">จาก</p>
                <p class="text-4xl">{totalCount} คน</p>
            </div>
            <div class="w-0.5 bg-black my-5"></div>
            <div class="bg-white p-5 text-left flex flex-col gap-2 rounded-r-lg">
                <p class="text-base">คิดเป็น</p>
                <p class="text-4xl">{percentage.toFixed(2)} %</p>
            </div>
        </div>
        <div class="bg-white rounded-lg border border-secondary h-full w-ful flex gap-3">
            <div class="bg-secondary px-7 h-full rounded-l-lg flex items-center justify-center w-fit">
                <svg class="w-20 h-20 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>
            </div>
            <div class="bg-white p-5 text-left flex flex-col gap-2 rounded-r-lg">
                <p class="text-base">ยังไม่เข้าร่วม</p>
                <div class="flex items-end">
                    <p class="text-4xl">{totalCount - checkInCount} คน</p>
                    <p class="ml-3 text-sm font-semibold">({(100 - percentage).toFixed(2)} %)</p>
                </div>
            </div>
        </div>
    </div>
    <div class="w-full bg-gray-200 rounded-lg h-92 p-10 flex flex-col gap-3 mt-20 items-center justify-center">
        <p class="text-4xl font-semibold mb-5">ตรวจบัตรเข้าร่วมงาน</p>
        <p class="text-lg">กรอกรหัสนักศึกษาหรือโค้ดที่นั่งเพื่อตรวจบัตรเข้างาน</p>
        <input bind:value={identifier} class="w-108 rounded-lg">
        <button onclick={handleSubmit} class="w-108 py-3 rounded-lg text-white text-lg bg-accent hover:bg-accent-hover hover:cursor-pointer">Check in</button>
    </div>
</div>
