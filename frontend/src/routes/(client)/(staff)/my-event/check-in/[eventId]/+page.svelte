<script lang='ts'>
  import { invalidate } from '$app/navigation';
  import { ApiError } from '$lib/scripts/api.js';
  import { checkInSeat, getReservation } from '$lib/scripts/booking.js';
  import type { SeatParts } from '$lib/scripts/seat.js';
  import type { Reservation } from '$lib/type/reservation.js';

    const {data, params} = $props();
    const percentage = $derived((data.checkInCount / (data.totalCount || 1)) * 100)
    let identifier: string = $state('');
    let reservationData: Reservation & SeatParts | null = $state(null);

    async function handleLoadData() {
        try{
            reservationData = await getReservation(params.eventId, identifier);
            identifier = ''
            status = "success";
        } catch (err){
            if (err instanceof ApiError) {
                if (err.code === 'NOT_FOUND') status = "not_found";
                else if (err.status === 400) status = "not_found";
            }
        }
        
    }

    async function handleSubmit() {
        try{
            if (!reservationData){
                status = 'client_error';
                return
            }
            await checkInSeat(params.eventId, reservationData.seatId);
            await invalidate(`increase:count`);
            reservationData = null;
            identifier = ''
            status = 'initial'
        } catch (err){
            if (err instanceof ApiError) {
                switch (err.code) {
                    case 'ALREADY_CHECKED_IN':
                        status = "replicated";
                        break;
                    case 'NOT_FOUND':
                        status = "not_found";
                        break;
                }
            }
        }
        
    }

    let status = $state("initial")
</script>
<div class="flex flex-col items-center mt-6 sm:mt-10 mx-auto w-full max-w-6xl sm:max-w-7xl self-center p-5 pt-12">
    <h1 class="text-4xl font-semibold mb-10">ข้อมูลการเข้าร่วมกิจกรรม</h1>
    <div class="w-full bg-gray-200 rounded-lg h-52 grid grid-cols-3 p-10 gap-5">
        <div class="col-span-2 bg-white rounded-lg border border-accent h-full w-ful flex gap-3">
            <div class="bg-accent px-7 h-full rounded-l-lg flex items-center justify-center w-fit">
                <svg class="w-20 h-20 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-464a208 208 0 1 0 0 416 208 208 0 1 0 0-416zm70.7 121.9c7.8-10.7 22.8-13.1 33.5-5.3 10.7 7.8 13.1 22.8 5.3 33.5L243.4 366.1c-4.1 5.7-10.5 9.3-17.5 9.8-7 .5-13.9-2-18.8-6.9l-55.9-55.9c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l36 36 105.6-145.2z"/></svg>
            </div>
            <div class="bg-white p-5 text-left flex flex-col gap-2">
                <p class="text-base">เข้าร่วมงานแล้ว</p>
                <p class="text-4xl">{data.checkInCount} คน</p>
            </div>
            <div class="w-0.5 bg-black my-5"></div>
            <div class="bg-white p-5 text-left flex flex-col gap-2">
                <p class="text-base">จาก</p>
                <p class="text-4xl">{data.totalCount} คน</p>
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
                    <p class="text-4xl">{data.totalCount - data.checkInCount} คน</p>
                    <p class="ml-3 text-sm font-semibold">({(100 - percentage).toFixed(2)} %)</p>
                </div>
            </div>
        </div>
    </div>
    <div class="w-full bg-gray-200 rounded-lg h-92 p-10 flex flex-col gap-3 mt-20 items-center justify-center">
        <p class="text-4xl font-semibold mb-5">ตรวจบัตรเข้าร่วมงาน</p>
        <p class="text-lg">กรอกรหัสนักศึกษาหรือโค้ดที่นั่ง (ชื่อโซน-ที่นั่ง) เพื่อตรวจบัตรเข้างาน</p>
        <input bind:value={identifier} class="w-108 rounded-lg">
        <button onclick={handleLoadData} class="w-108 py-3 rounded-lg text-white text-lg bg-accent hover:bg-accent-hover hover:cursor-pointer">Check in</button>
    </div>

    {#if status !== 'initial'}
     <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs p-4"
        tabindex="-1"
    >
        <div class="w-full h-full z-10 flex justify-center items-center fixed top-0 left-0">
        {#if reservationData && status === "success"}
            <div class="bg-white drop-shadow-2xl rounded-2xl w-108 h-fit flex flex-col items-center p-5">
                <p class="text-xl font-semibold">สรุปข้อมูล</p>
                <hr class="w-full mt-3">
                <p class="my-5 font-semibold">{reservationData.email}</p>
                <div class="flex gap-3 text-2xl font-bold">
                    <p>Zone</p>
                    <p class="text-orange-600">{reservationData.zone}</p>
                </div>
                <div class="flex gap-3 text-2xl font-bold">
                    <p>Seat</p>
                    <p class="text-orange-600">{reservationData.seat}</p>
                </div>
                <button onclick={handleSubmit} class="bg-secondary hover:bg-secondary-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-5">Confirm</button>
                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">Cancel</button>
            </div>
            {:else if status === "not_found"}
            <div class="bg-white drop-shadow-2xl rounded-2xl w-108 h-fit flex flex-col items-center p-5">
                <p class="text-xl font-semibold">ไม่พบข้อมูลในระบบ</p>

                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">Back</button>
            </div>
            {:else if status === "client_error"}
            <div class="bg-white drop-shadow-2xl rounded-2xl w-108 h-fit flex flex-col items-center p-5">
                <p class="text-xl font-semibold">เกิดข้อผิดพลาดในการส่งข้อมูล</p>

                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">Back</button>
            </div>
            {:else if status === "replicated"}
            <div class="bg-white drop-shadow-2xl rounded-2xl w-108 h-fit flex flex-col items-center p-5">
                <p class="text-xl font-semibold">ผู้ใช้หรือที่นั่งนี้ทำการ Check in แล้ว</p>

                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">Back</button>
            </div>
            {/if}
        </div>
        </div>
    {/if}
</div>
