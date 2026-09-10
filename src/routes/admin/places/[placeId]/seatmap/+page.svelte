<script lang="ts">
	import SeatEditor from "$lib/components/seat-editor/components/SeatEditor.svelte";
	import { SeatEditorState } from "$lib/components/seat-editor/seatState.svelte.js";
  import type { Place } from "$lib/type/place.js";
	import { onMount, tick } from "svelte";
	let { params } = $props();
	let seatState: SeatEditorState | undefined = $state();
	let isLoading = $state(true);
	let place:Place | null = $state(null)
	onMount(async () => {
		place = await fetch(`/api/place/${params.placeId}`, {
			method: 'GET',
			credentials:'include'
		})
		.then((response) => {
			return response.json()
		})
		.then(async (data) => {
			return data.body.data
		})
		
		await fetch(`/api/place/layout?placeId=${params.placeId}`, {
			method: 'GET',
			credentials:'include'
		})
		.then((response) => {
			return response.arrayBuffer()
		})
		.then(async (data) => {
			if (place){
				seatState = new SeatEditorState(place.placeId);
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
<SeatEditor place={place} state={seatState} backLink={`/admin/places/${params.placeId}`}></SeatEditor>
{/if}

