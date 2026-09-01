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
  "condition": "เป็นนักศึกษา IT",
  "date": {
    "end": "2026-09-03T19:21",
    "start": "2026-09-03T18:21"
  },
  "detail": "ชั่งน้ำหนักกระต่ายรายปี",
  "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
  "host": "67070094@kmitl.ac.th",
  "name": "ชั่งน้ำหนักกระต่าย",
  "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "place": "Auditorium IT",
  "register-date": {
    "end": "2026-08-31T21:21",
    "start": "2026-08-31T19:21"
  },
  "timetable": [
    {
      "activity": [
        {
          "activity": "ชั่งน้ำหนักกระต่าย",
          "end": "19:21",
          "start": "18:21"
        }
      ],
      "date": "2026-09-03"
    }
  ]
},
    {
  "condition": "เป็นนักศึกษา IT",
  "date": {
    "end": "2026-09-03T19:21",
    "start": "2026-09-03T18:21"
  },
  "detail": "ชั่งน้ำหนักกระต่ายรายปี",
  "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
  "host": "67070094@kmitl.ac.th",
  "name": "ชั่งน้ำหนักกระต่าย",
  "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "place": "Auditorium IT",
  "register-date": {
    "end": "2026-08-31T21:21",
    "start": "2026-08-31T19:21"
  },
  "timetable": [
    {
      "activity": [
        {
          "activity": "ชั่งน้ำหนักกระต่าย",
          "end": "19:21",
          "start": "18:21"
        }
      ],
      "date": "2026-09-03"
    }
  ]
},
    {
  "condition": "เป็นนักศึกษา IT",
  "date": {
    "end": "2026-09-03T19:21",
    "start": "2026-09-03T18:21"
  },
  "detail": "ชั่งน้ำหนักกระต่ายรายปี",
  "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
  "host": "67070094@kmitl.ac.th",
  "name": "ชั่งน้ำหนักกระต่าย",
  "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "place": "Auditorium IT",
  "register-date": {
    "end": "2026-08-31T21:21",
    "start": "2026-08-31T19:21"
  },
  "timetable": [
    {
      "activity": [
        {
          "activity": "ชั่งน้ำหนักกระต่าย",
          "end": "19:21",
          "start": "18:21"
        }
      ],
      "date": "2026-09-03"
    }
  ]
},
    {
  "condition": "เป็นนักศึกษา IT",
  "date": {
    "end": "2026-09-03T19:21",
    "start": "2026-09-03T18:21"
  },
  "detail": "ชั่งน้ำหนักกระต่ายรายปี",
  "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
  "host": "67070094@kmitl.ac.th",
  "name": "ชั่งน้ำหนักกระต่าย",
  "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "place": "Auditorium IT",
  "register-date": {
    "end": "2026-08-31T21:21",
    "start": "2026-08-31T19:21"
  },
  "timetable": [
    {
      "activity": [
        {
          "activity": "ชั่งน้ำหนักกระต่าย",
          "end": "19:21",
          "start": "18:21"
        }
      ],
      "date": "2026-09-03"
    }
  ]
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