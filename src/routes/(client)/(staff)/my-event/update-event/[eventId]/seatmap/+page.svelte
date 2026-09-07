<script lang="ts">
	import SeatEditor from "$lib/components/zone-editor/components/ZoneEditor.svelte";
	import { ZoneEditorState } from "$lib/components/zone-editor/zoneState.svelte.js";
  import ZoneEditor from "$lib/components/zone-editor/components/ZoneEditor.svelte";
	import { onMount, tick } from "svelte";
  import type { Place } from "$lib/type/place.js";
	let { params } = $props();
	let seatState: ZoneEditorState | undefined = $state();
	let isLoading = $state(false);
	let place = $state({} as Place)
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
			return response.arrayBuffer()
		})
		.then(async (data) => {
			seatState?.loadFromMessagePack(data);
			await tick()
			isLoading = false;
		})
		.catch((err) => {
			alert(err);
		})
	})
</script>
{#if isLoading}
	<div class="fixed w-screen h-screen flex items-center justify-center p-8 text-xs text-slate-500">
		กำลังโหลดผังผืนผ้าใบ... (Loading layout...)
	</div>
{/if}
<ZoneEditor place={place} bind:state={seatState} backLink={`/admin/events/${params.eventId}`}></ZoneEditor>