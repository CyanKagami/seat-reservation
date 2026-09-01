<script lang="ts">
  import Carousel from "$lib/components/Carousel.svelte";
  import EventBox from "$lib/components/EventBox.svelte";
    import type { Slide } from "$lib/type/slide";
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";

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

  let events:Event[] = $state([])
    onMount(async () => {
        events = await fetch('/api/event/', {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body
        })
        console.log(events)
    })
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