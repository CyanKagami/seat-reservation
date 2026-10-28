<script lang="ts">
  	import ZoneEditor from "$lib/components/zone-editor/components/ZoneEditor.svelte";
	import { ZoneEditorState } from "$lib/components/zone-editor/zoneState.svelte.js";
	import type { Place } from "$lib/type/place.js";
	import type { PageData } from "./$types";
	let { data, params }: { data: PageData; params: { eventId: string } } = $props();
	let seatState: ZoneEditorState | undefined = $state();
	let place: Place = $derived(data.place);
	$effect(() => {
		const state = new ZoneEditorState(data.place.placeId, params.eventId);
		state.loadFromMessagePack(data.layoutData);
		seatState = state;
	});
</script>
{#if !seatState}
	<div class="fixed w-screen h-screen flex items-center justify-center p-8 text-xs text-slate-500">
		กำลังโหลดผังผืนผ้าใบ... (Loading layout...)
	</div>
{:else if place && seatState}
<ZoneEditor {place} zoneState={seatState} backLink={`/my-event/update-event/${params.eventId}`}></ZoneEditor>
{/if}
