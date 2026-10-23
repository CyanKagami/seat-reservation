<script lang="ts">
  import Carousel from "$lib/components/Carousel.svelte";
  import EventBox from "$lib/components/EventBox.svelte";
    import type { Slide } from "$lib/type/slide";
    import type { Event } from "$lib/type/event";
    import { onMount } from "svelte";
  import { apiFetch } from "$lib/scripts/api";

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
        events = await apiFetch('/event/', {
            method: "GET",
        })
        .then(async (response) => {
            return (await response.json()).body
        })
    })
</script>
<Carousel slides={mySlides} />

<div class="w-full">
    <!-- Tabs Header -->
    <div class="bg-secondary w-full h-16 sm:h-20 flex items-end px-4 sm:px-10 lg:px-20 gap-2 sm:gap-3 overflow-x-auto">
        <div class="bg-white w-fit px-6 sm:px-10 py-2 rounded-t-2xl shadow-sm cursor-pointer">
            <p class="font-semibold text-sm sm:text-xl text-gray-800">All Events</p>
        </div>
        <div class="bg-dark-secondary w-fit px-6 sm:px-10 py-2 rounded-t-2xl shadow-sm cursor-pointer">
            <p class="font-semibold text-sm sm:text-xl text-white">Coming Soon</p>
        </div>
    </div>

    <!-- Content Area -->
    <div class="pt-6 sm:pt-8 w-full px-4 sm:px-10 lg:px-20 flex flex-col gap-8 sm:gap-10">

        <!-- Search bar -->
        <div class="w-full max-w-md">
            <label class="text-xs sm:text-sm font-semibold text-gray-700 block mb-1">Search</label>
            <input
                type="text"
                placeholder="Search events..."
                class="rounded-lg w-full border-gray-300 focus:border-accent focus:ring-accent p-2.5 text-sm sm:text-base shadow-sm"
            >
        </div>

        <!-- Event Registration Grid / List -->
        <div class="w-full flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-10 gap-y-8 sm:gap-y-10">
            {#each events as event}
                <EventBox {event}></EventBox>
            {/each}
        </div>

    </div>
</div>