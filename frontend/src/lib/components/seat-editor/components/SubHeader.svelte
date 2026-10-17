<script lang="ts">
  import type { Place } from "$lib/type/place";
	import type { SeatEditorState } from "../seatState.svelte";

	let { state, backLink, place  }: { state: SeatEditorState, backLink:string, place:Place } = $props();
</script>

<div class="bg-[#f0f0f0] px-6 py-2.5 border-b border-slate-300 flex items-center justify-between">
	<div class="flex items-center">
		<a href={backLink}>
			<svg class="w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"/></svg>
		</a>
		<h1 class="text-base font-bold text-slate-900">แผนผังของ {place ? `${place.name} (${place.location.name})` : ''}</h1>
	</div>
	<button 
        id="save-button"
		onclick={state.handleSaveButtonClick}
		disabled={state.overlappingIds.size > 0}
		class="px-6 py-1.5 bg-[#1c6b80] hover:bg-[#165566] text-white font-medium text-sm rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
	>
		บันทึก
	</button>
</div>