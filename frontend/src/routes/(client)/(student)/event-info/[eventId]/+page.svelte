<script lang='ts'>
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";
    import { formatThaiDateTime, formatThaiDateTimeShort } from "$lib/scripts/formatTime"
    import { apiFetch } from "$lib/scripts/api.js";
    import { registrationOpen } from '$lib/scripts/booking.js'

    let { params } = $props()
    //fetch event
    let event: Event = $state({} as Event)
    let start_date = $state(new Date())
    let end_date = $state(new Date())
    let register_date_start = $state(new Date())
    let register_date_end = $state(new Date())

    onMount(async () => {
        event = await apiFetch(`/event/getFromId/${params.eventId}`, {
            method: "GET",
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })
        start_date = new Date(event.date.start)
        end_date = new Date(event.date.end)
        register_date_start = new Date(event["register-date"].start)
        register_date_end = new Date(event["register-date"].end)
    })
</script>

<!-- Hero Section: รูปภาพและข้อมูลเบื้องต้น -->
<div class="w-full grid grid-cols-1 md:grid-cols-2 mt-20">
    <img src={event.picture ? event.picture : ""} alt='event' class="object-cover h-64 sm:h-80 md:h-96 w-full">
    <div class="w-full p-6 sm:p-10 flex flex-col justify-between">
        <div>
            <p class="font-semibold text-sm sm:text-xl text-gray-700">
                {formatThaiDateTimeShort(start_date, end_date)} : {event.place ? `${event.place.name} (${event.place.location.name})` : ''}
            </p>
            <p class="text-2xl sm:text-4xl font-semibold my-3 sm:my-6">{event.name || ""}</p>
            <p class="text-base sm:text-xl text-gray-500">By {event.host || ""}</p>
        </div>

        <!-- Register Button -->
        <div class="mt-6 md:mt-0">
            {#if registrationOpen(event)}
                <a href="/reservation/{params.eventId}">
                    <button class="bg-accent w-full py-3 rounded-xl text-white font-semibold text-lg sm:text-xl hover:cursor-pointer shadow-md transition-colors">ลงทะเบียน</button>
                </a>
            {:else}
                <button class="bg-stone-600 w-full py-3 rounded-xl text-white font-semibold text-lg sm:text-xl cursor-not-allowed">ไม่อยู่ในช่วงเวลาลงทะเบียน</button>
            {/if}
        </div>
    </div>
</div>

<!-- Decorative Bar -->
<div class="bg-secondary w-full h-12 sm:h-20 flex items-end px-6 sm:pl-20 gap-3"></div>

<!-- Content Grid Area -->
<div class="grid grid-cols-1 lg:grid-cols-2 px-4 sm:px-10 lg:px-36 py-6 gap-6 lg:gap-0">

    <!-- Left Panel: รายละเอียดกิจกรรม -->
    <div class="p-4 sm:p-10 flex flex-col gap-10">
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-xl sm:text-2xl">รายละเอียดกิจกรรม</h1>
            <p lang="th" class="[!word-break:normal] [!overflow-wrap:anywhere] text-gray-700 leading-relaxed text-sm sm:text-base">
                {event.detail || ""}
            </p>
        </div>
    </div>

    <!-- Right Panel: ข้อมูลเวลา สถานที่ และเงื่อนไข -->
    <div class="p-4 sm:p-10 flex flex-col gap-8 sm:gap-10">
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-xl sm:text-2xl">ระยะเวลาที่เปิดลงทะเบียน</h1>
            <p lang="th" class="text-sm sm:text-base text-gray-700">
                {formatThaiDateTime(register_date_start, register_date_end)}
            </p>
        </div>

        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-xl sm:text-2xl">ช่วงเวลากิจกรรม</h1>
            <p lang="th" class="text-sm sm:text-base text-gray-700">
                <span class="font-semibold">เริ่ม:</span> {formatThaiDateTime(start_date)}
            </p>
            <p lang="th" class="text-sm sm:text-base text-gray-700">
                <span class="font-semibold">สิ้นสุด:</span> {formatThaiDateTime(end_date)}
            </p>
        </div>

        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-xl sm:text-2xl">สถานที่</h1>
            <p lang="th" class="text-sm sm:text-base text-gray-700">
                {event.place ? `${event.place.name} (${event.place.location.name})` : ''}
            </p>
        </div>

        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-xl sm:text-2xl">เงื่อนไขการเข้าร่วมกิจกรรม</h1>
            <p lang="th" class="text-sm sm:text-base text-gray-700">
                {!("condition" in event) ? "ไม่มีเงื่อนไขการสมัครเข้าร่วมกิจกรรม" : event.condition}
            </p>
        </div>

        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-xl sm:text-2xl">ผู้จัดกิจกรรม</h1>
            <p lang="th" class="text-sm sm:text-base text-gray-700">
                {event.host || ""}
            </p>
        </div>
    </div>

</div>