<script lang='ts'>
    import EventBox from "$lib/components/EventBox.svelte";
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";
    let events:Event[] = $state([])
    onMount(async () => {
        events = await fetch('/api/event', {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body
        })
        console.log(events)
    })

     // placeholder
//   const events:Event[] = [
//     {
//   "condition": "เป็นนักศึกษา IT",
//   "date": {
//     "end": "2026-09-03T19:21",
//     "start": "2026-09-03T18:21"
//   },
//   "detail": "ชั่งน้ำหนักกระต่ายรายปี",
//   "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
//   "host": "67070094@kmitl.ac.th",
//   "name": "ชั่งน้ำหนักกระต่าย",
//   "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
//   "place": "Auditorium IT",
//   "register-date": {
//     "end": "2026-08-31T21:21",
//     "start": "2026-08-31T19:21"
//   },
//   "timetable": [
//     {
//       "activity": [
//         {
//           "activity": "ชั่งน้ำหนักกระต่าย",
//           "end": "19:21",
//           "start": "18:21"
//         }
//       ],
//       "date": "2026-09-03"
//     }
//   ]
// },
//     {
//   "condition": "เป็นนักศึกษา IT",
//   "date": {
//     "end": "2026-09-03T19:21",
//     "start": "2026-09-03T18:21"
//   },
//   "detail": "ชั่งน้ำหนักกระต่ายรายปี",
//   "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
//   "host": "67070094@kmitl.ac.th",
//   "name": "ชั่งน้ำหนักกระต่าย",
//   "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
//   "place": "Auditorium IT",
//   "register-date": {
//     "end": "2026-08-31T21:21",
//     "start": "2026-08-31T19:21"
//   },
//   "timetable": [
//     {
//       "activity": [
//         {
//           "activity": "ชั่งน้ำหนักกระต่าย",
//           "end": "19:21",
//           "start": "18:21"
//         }
//       ],
//       "date": "2026-09-03"
//     }
//   ]
// },
//     {
//   "condition": "เป็นนักศึกษา IT",
//   "date": {
//     "end": "2026-09-03T19:21",
//     "start": "2026-09-03T18:21"
//   },
//   "detail": "ชั่งน้ำหนักกระต่ายรายปี",
//   "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
//   "host": "67070094@kmitl.ac.th",
//   "name": "ชั่งน้ำหนักกระต่าย",
//   "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
//   "place": "Auditorium IT",
//   "register-date": {
//     "end": "2026-08-31T21:21",
//     "start": "2026-08-31T19:21"
//   },
//   "timetable": [
//     {
//       "activity": [
//         {
//           "activity": "ชั่งน้ำหนักกระต่าย",
//           "end": "19:21",
//           "start": "18:21"
//         }
//       ],
//       "date": "2026-09-03"
//     }
//   ]
// },
//     {
//   "condition": "เป็นนักศึกษา IT",
//   "date": {
//     "end": "2026-09-03T19:21",
//     "start": "2026-09-03T18:21"
//   },
//   "detail": "ชั่งน้ำหนักกระต่ายรายปี",
//   "eventId": "08344717-c540-4376-9e0c-b648f36c26a2",
//   "host": "67070094@kmitl.ac.th",
//   "name": "ชั่งน้ำหนักกระต่าย",
//   "picture": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
//   "place": "Auditorium IT",
//   "register-date": {
//     "end": "2026-08-31T21:21",
//     "start": "2026-08-31T19:21"
//   },
//   "timetable": [
//     {
//       "activity": [
//         {
//           "activity": "ชั่งน้ำหนักกระต่าย",
//           "end": "19:21",
//           "start": "18:21"
//         }
//       ],
//       "date": "2026-09-03"
//     }
//   ]
// }
//   ]



</script>
<div class="my-24 flex flex-col items-center">
    <h1 class="text-4xl font-semibold">กิจกรรมของฉัน</h1>

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
