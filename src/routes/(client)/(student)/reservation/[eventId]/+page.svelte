<script lang='ts'>
  import ZoneChoosing from "$lib/components/ZoneChoosing.svelte";
  import ProgressBar from "$lib/components/reservation/ProgressBar.svelte";
  import EventRoom from "$lib/components/EventRoom.svelte";
  import type { Event } from "$lib/type/event.js";
  import { onMount } from "svelte";

  let {params} = $props()
  let event:Event = $state({} as Event)
  onMount(async () => {
        console.log("page", params.eventId)
        event = await fetch(`/api/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })})
    let status = $state("zone")
</script>
<div class="items-center flex flex-col gap-2 mt-10">
  <h1 class="text-3xl font-semibold">{event.name || ""}</h1>
  <ProgressBar status={status}></ProgressBar>

  {#if status === "zone"}
    <ZoneChoosing></ZoneChoosing>
  {:else if status === "seat"}
    <EventRoom></EventRoom>
  {:else}
    <div></div>
  {/if}
</div>