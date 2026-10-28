<script lang='ts'>
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { ApiError } from '$lib/scripts/api.js';
  import { checkInSeat, getReservation } from '$lib/scripts/booking.js';
  import { alertModal } from '$lib/store/alert.svelte';
  import type { SeatParts } from '$lib/scripts/seat.js';
  import type { Reservation } from '$lib/type/reservation.js';

    const {data, params} = $props();
    onMount(() => {
        if (data.loadError) {
            alertModal.failure(
                "เกิดข้อผิดพลาด",
                data.loadErrorMessage || "ไม่สามารถโหลดข้อมูลการเข้าร่วมได้ กรุณาลองอีกครั้ง"
            );
        }
    });
    const percentage = $derived((data.checkInCount / (data.totalCount || 1)) * 100)
    let identifier: string = $state('');
    let reservationData: Reservation & SeatParts | null = $state(null);

    function showCheckInFailure(message: string) {
        status = 'initial';
        alertModal.failure("เช็คชื่อไม่สำเร็จ", message);
    }

    async function handleLoadData() {
        try{
            reservationData = await getReservation(params.eventId, identifier);
            identifier = ''
            status = "success";
        } catch (err){
            if (err instanceof ApiError) {
                if (err.code === 'NOT_FOUND') status = "not_found";
                else alertModal.failure("ตรวจสอบข้อมูลไม่สำเร็จ", err.message);
            } else {
                alertModal.failure(
                    "ตรวจสอบข้อมูลไม่สำเร็จ",
                    err instanceof Error ? err.message : "ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองอีกครั้ง"
                );
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
                    default:
                        showCheckInFailure(err.message);
                }
            } else {
                showCheckInFailure(
                    err instanceof Error ? err.message : "ไม่สามารถเช็คชื่อได้ กรุณาลองอีกครั้ง"
                );
            }
        }
        
    }

    let status = $state("initial")
</script>
<div class="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
    <nav class="mb-5 flex min-w-0 items-center gap-2 text-sm text-dark-soft" aria-label="Breadcrumb">
        <a href="/my-event" class="transition-colors hover:text-dark">กิจกรรมของฉัน</a>
        <span aria-hidden="true">/</span>
        <a href="/my-event/event-info/{params.eventId}" class="transition-colors hover:text-dark">รายละเอียดกิจกรรม</a>
        <span aria-hidden="true">/</span>
        <span class="truncate font-semibold text-dark-muted">ตรวจสอบการเข้าร่วม</span>
    </nav>
    <h1 class="mb-6 text-3xl font-bold tracking-tight text-dark sm:text-4xl">ข้อมูลการเข้าร่วมกิจกรรม</h1>
    <div class="grid w-full grid-cols-1 gap-4 rounded-lg py-5 md:grid-cols-3 md:gap-5 md:py-10">
        <div class="col-span-1 flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-accent bg-white shadow-xs sm:flex-row md:col-span-2">
            <div class="flex shrink-0 items-center justify-center bg-accent px-5 py-4 sm:rounded-l-lg sm:px-7 sm:py-0">
                <svg class="h-12 w-12 fill-white sm:h-20 sm:w-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-464a208 208 0 1 0 0 416 208 208 0 1 0 0-416zm70.7 121.9c7.8-10.7 22.8-13.1 33.5-5.3 10.7 7.8 13.1 22.8 5.3 33.5L243.4 366.1c-4.1 5.7-10.5 9.3-17.5 9.8-7 .5-13.9-2-18.8-6.9l-55.9-55.9c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l36 36 105.6-145.2z"/></svg>
            </div>
            <div class="flex min-w-0 flex-col gap-2 p-4 text-left sm:p-5">
                <p class="text-base">เข้าร่วมงานแล้ว</p>
                <p class="text-3xl sm:text-4xl">{data.checkInCount} คน</p>
            </div>
            <div class="mx-5 h-px bg-black sm:my-5 sm:mx-0 sm:h-auto sm:w-0.5"></div>
            <div class="flex min-w-0 flex-col gap-2 p-4 pt-0 text-left sm:p-5">
                <p class="text-base">จาก</p>
                <p class="text-3xl sm:text-4xl">{data.totalCount} คน</p>
            </div>
            <div class="mx-5 h-px bg-black sm:my-5 sm:mx-0 sm:h-auto sm:w-0.5"></div>
            <div class="flex min-w-0 flex-col gap-2 p-4 pt-0 text-left sm:rounded-r-lg sm:p-5">
                <p class="text-base">คิดเป็น</p>
                <p class="text-3xl sm:text-4xl">{percentage.toFixed(2)} %</p>
            </div>
        </div>
        <div class="flex min-w-0 gap-3 overflow-hidden rounded-lg border border-secondary bg-white shadow-xs">
            <div class="flex shrink-0 items-center justify-center rounded-l-lg bg-secondary px-5 sm:px-7">
                <svg class="h-12 w-12 fill-white sm:h-20 sm:w-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>
            </div>
            <div class="flex min-w-0 flex-col justify-center gap-2 p-4 text-left sm:p-5">
                <p class="text-base">ยังไม่เข้าร่วม</p>
                <div class="flex flex-wrap items-end gap-x-3">
                    <p class="text-3xl sm:text-4xl">{data.totalCount - data.checkInCount} คน</p>
                    <p class="text-sm font-semibold">({(100 - percentage).toFixed(2)} %)</p>
                </div>
            </div>
        </div>
    </div>
    <section class="mt-5 w-full rounded-2xl border border-border-subtle bg-white p-4 shadow-xs sm:mt-10 sm:p-8">
        <div class="mx-auto flex w-full max-w-2xl flex-col gap-5 sm:gap-6">
            <div class="text-center">
                <h2 class="text-lg font-bold text-dark sm:text-2xl">ตรวจบัตรเข้าร่วมงาน</h2>
                <p class="mt-2 text-sm leading-relaxed text-dark-muted">
                    กรอกรหัสนักศึกษาหรือรหัสที่นั่ง เพื่อตรวจสอบสิทธิ์เข้าร่วมงาน
                </p>
            </div>

            <div class="flex flex-col gap-3">
                <label for="check-in-identifier" class="text-center text-sm font-semibold text-dark">รหัสนักศึกษาหรือรหัสที่นั่ง</label>
                <input
                    id="check-in-identifier"
                    bind:value={identifier}
                    type="text"
                    autocomplete="off"
                    placeholder="เช่น 65000000 หรือ S-7K2M9W4P3D"
                    class="w-full min-w-0 rounded-xl border border-border-strong bg-surface-base px-4 py-3 text-base text-dark placeholder:text-dark-soft focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden"
                />
                <button
                    type="button"
                    onclick={handleLoadData}
                    class="mt-1 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-xs transition-colors hover:cursor-pointer hover:bg-accent-hover"
                >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span>ตรวจสอบและเช็คชื่อ</span>
                </button>
            </div>
        </div>
    </section>

    {#if status !== 'initial'}
     <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs p-4"
        tabindex="-1"
    >
        <div class="fixed inset-0 z-10 flex items-center justify-center p-4">
        {#if reservationData && status === "success"}
            <div class="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
                <p class="text-xl font-semibold">สรุปข้อมูล</p>
                <hr class="w-full mt-3">
                <p class="my-5 max-w-full break-all text-center font-semibold">{reservationData.email}</p>
                {#if reservationData.zone || reservationData.seat}
                    <div class="flex max-w-full items-center justify-center gap-2 text-xl font-bold sm:text-2xl">
                        {#if reservationData.zone}
                            <span>โซน <span class="text-orange-600">{reservationData.zone}</span></span>
                        {/if}
                        {#if reservationData.zone && reservationData.seat}
                            <span aria-hidden="true">·</span>
                        {/if}
                        {#if reservationData.seat}
                            <span>ที่นั่ง <span class="text-orange-600">{reservationData.seat}</span></span>
                        {/if}
                    </div>
                {/if}
                <p class="mt-4 max-w-full break-all text-center text-sm text-dark-soft">
                    รหัสที่นั่ง: <span class="font-mono font-semibold text-dark">{reservationData.seatId}</span>
                </p>
                <button onclick={handleSubmit} class="bg-secondary hover:bg-secondary-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-5">ยืนยันเช็คชื่อ</button>
                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">ยกเลิก</button>
            </div>
            {:else if status === "not_found"}
            <div class="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
                <p class="text-xl font-semibold">ไม่พบข้อมูลในระบบ</p>

                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">กลับ</button>
            </div>
            {:else if status === "client_error"}
            <div class="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
                <p class="text-xl font-semibold">เกิดข้อผิดพลาดในการส่งข้อมูล</p>

                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">กลับ</button>
            </div>
            {:else if status === "replicated"}
            <div class="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
                <p class="text-xl font-semibold">ผู้ใช้หรือที่นั่งนี้เช็คชื่อแล้ว</p>

                <button onclick={() => {status = 'initial';}} class="bg-accent hover:bg-accent-hover hover:cursor-pointer text-white p-2 w-full rounded-lg mt-3">กลับ</button>
            </div>
            {/if}
        </div>
        </div>
    {/if}
</div>
