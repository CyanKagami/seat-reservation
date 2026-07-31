<script lang='ts'>
    import type { Event } from "$lib/type/event";
    //fetch event
    const event:Event =
    {
        "picture": 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        "date":{
            "start": {
                "day":"1",
                "month": "September",
                "year" : "2569",
                "time" : "08:00"
            },
            "end" : {
                "day": "6",
                "month": "September",
                "year" : "2569",
                "time" : "16:00"
            }
        },
        "place":"KMITL Conventional Hall",
        "host":"พี่เดี่ยว",
        "name":"KMITL Expo",
        "detail": '29 กรกฎาคม 2569 #วันอาสาฬหบูชา\
        “วันอาสาฬหบูชา” มาจากคำว่า “อาสาฬหปุรณมีบูชา” หมายถึง การบูชาในวันเพ็ญเดือนอาสาฬหะ ซึ่งเป็นเดือน 4 ตามปฏิทินของอินเดีย ตรงกับเดือน 8 ตามปฏิทินจันทรคติของไทย คือวันเพ็ญ ขึ้น 15 ค่ำ เดือน 8\
        “วันอาสาฬหบูชา” มีความสำคัญทางพระพุทธศาสนาคือ เป็นวันที่พระพุทธเจ้าทรงแสดงปฐมเทศนา “ธัมมจักกัปปวัตตนสูตร” โปรดปัญจวัคคีย์ทั้ง 5 คือ พระโกณฑัญญะ พระวัปปะ พระภัททิยะ พระมหานามะ และพระอัสสชิ ที่ป่าอิสิปตนมฤคทายวัน เมืองพาราณสี แคว้นมคธ\
        #วันพระใหญ่ #วันอาสาฬหบูชา2569 #วันนี้วันพระ\
        #สจล #KMITL #พระจอมเกล้าลาดกระบัง',
        "timetable": [
            {
                "start": "07:00",
                "end": "08:50",
                "activity": "รับประทานอาหาร"
            },
            {
                "start":"09:00",
                "end": "09:15",
                "activity": "กิจกรรม Check in"
            },
            {
                "start":"09:15",
                "end": "10:00",
                "activity": "Re-check ข้อมูล"
            }
        ],
        "register-date":"1 - 30 June 2026"
    }

    const show_date = (event.date.start.month === event.date.end.month) ?
    event.date.start.day + " - " + event.date.end.day + " " + event.date.start.month
    : event.date.start.day + " " + event.date.start.month + " - " + event.date.end.day + " " + event.date.end.month
</script>

<div class="h-96 w-full grid grid-cols-2">
    <img src={event.picture} alt='event' class="object-cover h-96 w-full">
    <div class="w-full p-10 flex flex-col justify-between">
        <div>
            <p class="font-semibold text-xl">{show_date} : {event.place}</p>
            <p class="text-4xl font-semibold my-6">{event.name}</p>
            <p class="text-xl text-gray-400">By {event.host}</p>
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
        <p lang="th" class="[!word-break:normal] [!overflow-wrap:anywhere]">{event.detail}</p>
        </div>
        <div>
            <h1 class="font-semibold text-2xl mb-5">ตารางกิจกรรม</h1>
            <table class="w-full border border-black">
                <thead>
                    <tr>
                        <th class="border border-black">เวลาเริ่ม</th>
                        <th class="border border-black">เวลาสิ้นสุด</th>
                        <th class="border border-black">รายละเอียด</th>
                    </tr>
                </thead>

                <!--timetable-->
                <tbody>
                    {#each event.timetable as activity}
                        <tr>
                            <td class="border border-black text-center">{activity.start} น.</td>
                            <td class="border border-black text-center">{activity.end} น.</td>
                            <td class="border border-black text-center">{activity.activity}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
    <!--right panel-->
    <div class="p-10 flex flex-col gap-10">
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">ระยะเวลาที่เปิดลงทะเบียน</h1>
            <p lang="th">{event["register-date"]}</p>
        </div>
        <div class="flex flex-col gap-2">
            <h1 class="font-semibold text-2xl">ช่วงเวลากิจกรรม</h1>
            <p lang="th"><span class="font-semibold">เริ่ม:</span>
                {event.date.start.day} {event.date.start.month} {event.date.start.year}, {event.date.start.time} น.
            </p>
            <p lang="th"><span class="font-semibold">สิ้นสุด:</span>
                {event.date.end.day} {event.date.end.month} {event.date.end.year}, {event.date.end.time} น.
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
            <p lang="th">{event.host}</p>
        </div>
    </div>
</div>