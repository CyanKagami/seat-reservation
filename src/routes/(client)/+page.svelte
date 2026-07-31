<script lang="ts">
  import Carousel from "$lib/components/Carousel.svelte";
  import EventBox from "$lib/components/EventBox.svelte";
    import type { Slide } from "$lib/type/slide";
    import type { Event } from "$lib/type/event";
  // sample data
    const mySlides: Slide[] = [
    {
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      title: 'Misty Mountains',
      description: 'Explore nature in all its beauty.'
    },
    {
      image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
      title: 'Dense Forest',
      description: 'Feel the fresh air and tranquility.'
    },
    {
      image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80',
      title: 'Serene Waterfalls',
      description: 'Discover hidden spots around the world.'
    }
  ];

  // placeholder
  const events:Event[] = [
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
    },
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
    },
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
    },
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
  ]
</script>
<Carousel slides={mySlides} />
<div>
    <div class="bg-secondary w-full h-20 flex items-end pl-20 gap-3">
        <div class="bg-white w-fit px-10 py-2 rounded-t-2xl">
            <p class="font-semibold text-xl">All Events</p>
        </div>
        <div class="bg-dark-secondary w-fit px-10 py-2 rounded-t-2xl">
            <p class="font-semibold text-xl text-white">Coming Soon</p>
        </div>
    </div>

    <!--content-->
    <div class="pt-8 w-full px-20 flex flex-col gap-10">

        <!--Search bar-->
        <div>
            <p class="text-sm font-semibold">Search</p>
            <input class="rounded-lg w-96">
        </div>

        <!--Event Registration-->
        <div class="w-full flex flex-wrap gap-15 gap-y-10">
        {#each events as event }
            <EventBox event={event}></EventBox>
        {/each}
        </div>
    </div>
</div>