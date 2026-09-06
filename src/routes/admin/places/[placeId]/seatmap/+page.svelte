<script lang="ts">
	import SeatEditor from "$lib/components/seat-editor/components/SeatEditor.svelte";
	import { SeatEditorState } from "$lib/components/seat-editor/seatState.svelte.js";
	import { onMount, tick } from "svelte";
	let { params } = $props();
	let seatState: SeatEditorState | undefined = $state();
	let isLoading = $state(true);
	onMount(async () => {
		fetch(`/api/place/layout?placeId=${params.placeId}`, {
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
<SeatEditor placeId={params.placeId} bind:state={seatState} backLink={`/admin/places/${params.placeId}`}></SeatEditor>