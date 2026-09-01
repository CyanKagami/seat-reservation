<script lang='ts'>
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";
    import {formatThaiDateTime, formatThaiDateTimeShort} from "$lib/scripts/formatTime"

    let {params} = $props()
    //fetch event
    let event:Event = $state({} as Event)
    let start_date = $state(new Date())
    let end_date = $state(new Date())
    let register_date_start = $state(new Date())
    let register_date_end = $state(new Date())
    onMount(async () => {
        console.log("page", params.eventId)
        event = await fetch(`/api/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })
        console.log(event)
        start_date = new Date(event.date.start)
        end_date = new Date(event.date.end)
        register_date_start = new Date(event["register-date"].start)
        register_date_end = new Date(event["register-date"].end)
    })

</script>

<div class="h-96 w-full grid grid-cols-2">
    <img src={event.picture ? event.picture : ""} alt='event' class="object-cover h-96 w-full">
    <div class="w-full p-10 flex flex-col justify-between">
        <div>
            <p class="font-semibold text-xl">{formatThaiDateTimeShort(start_date, end_date)} : {event.place ? event.place : ""}</p>
            <p class="text-4xl font-semibold my-6">{event.name || ""}</p>
            <p class="text-xl text-gray-400">By {event.host || ""}</p>
        </div>
        <!--register button-->
        <a href="/event-info/1">
            <button class="bg-accent w-full py-2 rounded-xl text-white font-semibold mt-3 text-xl hover:cursor-pointer">Register</button>
        </a>
    </div>
</div>
<div class="bg-secondary w-full h-20 flex items-end pl-20 gap-3">

</div>
<!--Content -->
<div class="grid grid-cols-2 px-36">
    <!--left panel-->
    <div class="p-10 flex flex-col gap-20">
        <div class="flex flex-col gap-2">
        <h1 class="font-semibold text-2xl">รายละเอียดกิจกรรม</h1>
        <p lang="th" class="[!word-break:normal] [!overflow-wrap:anywhere]">{event.detail || ""}</p>
        </div>
    </div>
    <!--right panel-->
    <div class="p-10 flex flex-col gap-10">
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">ระยะเวลาที่เปิดลงทะเบียน</h1>
            <p lang="th">{formatThaiDateTime(register_date_start, register_date_end)}
            </p>
        </div>
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">ช่วงเวลากิจกรรม</h1>
            <p lang="th"><span class="font-semibold">เริ่ม:</span>
                {formatThaiDateTime(start_date)}
            </p>
            <p lang="th"><span class="font-semibold">สิ้นสุด:</span>
                {formatThaiDateTime(end_date)}
            </p>
        </div>
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">สถานที่</h1>
            <p lang="th">{event.place}</p>
        </div>
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">เงื่อนไขการเข้าร่วมกิจกรรม</h1>
            <p lang="th">{!("condition" in event) ? "ไม่มีเงื่อนไขการสมัครเข้าร่วมกิจกรรม" : event.condition}</p>
        </div>
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">ผู้จัดกิจกรรม</h1>
            <p lang="th">{event.host || ""}</p>
        </div>
    </div>
</div>