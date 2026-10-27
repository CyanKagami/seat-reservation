<script lang="ts">
	import SeatEditor from "$lib/components/seat-editor/components/SeatEditor.svelte";
	import { SeatEditorState } from "$lib/components/seat-editor/seatState.svelte.js";
  import { apiFetch } from "$lib/scripts/api.js";
	import { alertModal } from "$lib/store/alert.svelte";
	import type { Place } from "$lib/type/place.js";
	import { onMount } from "svelte";
	let { params } = $props();
	let seatState: SeatEditorState | undefined = $state();
	let isLoading = $state(true);
	let place:Place | null = $state(null)
	onMount(async () => {
		place = await apiFetch(`/place/${params.placeId}`, {
			method: 'GET',
		})
		.then((response) => {
			return response.json()
		})
		.then(async (data) => {
			return data.body.data
		})
		
		await apiFetch(`/place/layout?placeId=${params.placeId}`, {
			method: 'GET',
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
			alertModal.failure("เกิดข้อผิดพลาด", String(err));
		})
		
		isLoading = false;
	})
</script>
{#if isLoading}
	<div class="fixed w-screen h-screen flex items-center justify-center p-8 text-xs text-slate-500">
		กำลังโหลดผังผืนผ้าใบ... (Loading layout...)
	</div>
{:else}
<SeatEditor place={place} seatState={seatState} backLink={`/admin/places/${params.placeId}`}></SeatEditor>
{/if}
