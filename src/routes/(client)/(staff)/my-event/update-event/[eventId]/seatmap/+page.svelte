<script lang="ts">
  	import ZoneEditor from "$lib/components/zone-editor/components/ZoneEditor.svelte";
	import { ZoneEditorState } from "$lib/components/zone-editor/zoneState.svelte.js";
  	import type { Place } from "$lib/type/place.js";
	import { onMount } from "svelte";
	let { params } = $props();
	let seatState: ZoneEditorState | undefined = $state();
	let isLoading = $state(true);
	let place:Place | null = $state(null)
	onMount(async () => {
		const event = await fetch(`/api/event/getFromId/${params.eventId}`, {
            method: "GET",
            credentials: 'include'
        })
        .then(async (response) => {
            return (await response.json()).body[0]
        })
		place = event.place
		await fetch(`/api/place/layout?placeId=${place.placeId}`, {
			method: 'GET',
			credentials:'include'
		})
		.then((response) => {
			return response.arrayBuffer();
		})
		.then(async (data) => {
			if (place){
				seatState = new ZoneEditorState(place.placeId);
				seatState.loadFromMessagePack(data);
			}
		})
		.catch((err) => {
			alert(err);
		})
		isLoading = false;
	})
</script>
{#if isLoading}
	<div class="fixed w-screen h-screen flex items-center justify-center p-8 text-xs text-slate-500">
		กำลังโหลดผังผืนผ้าใบ... (Loading layout...)
	</div>
{:else}
<ZoneEditor place={place} state={seatState} backLink={`/admin/events/${params.eventId}`}></ZoneEditor>
{/if}

