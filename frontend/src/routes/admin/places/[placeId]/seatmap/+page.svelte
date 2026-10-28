<script lang="ts">
	import SeatEditor from "$lib/components/seat-editor/components/SeatEditor.svelte";
	import { SeatEditorState } from "$lib/components/seat-editor/seatState.svelte.js";
	import type { Place } from "$lib/type/place.js";
	import type { PageData } from "./$types";
	let { data, params }: { data: PageData; params: { placeId: string } } = $props();
	let seatState: SeatEditorState | undefined = $state();
	let place: Place = $derived(data.place);
	$effect(() => {
		const state = new SeatEditorState(data.place.placeId);
		state.loadFromMessagePack(data.layoutData);
		seatState = state;
	});
</script>
{#if !seatState}
	<div class="fixed w-screen h-screen flex items-center justify-center p-8 text-xs text-slate-500">
		กำลังโหลดผังผืนผ้าใบ... (Loading layout...)
	</div>
{:else}
<SeatEditor {place} {seatState} backLink={`/admin/places/${params.placeId}`}></SeatEditor>
{/if}
