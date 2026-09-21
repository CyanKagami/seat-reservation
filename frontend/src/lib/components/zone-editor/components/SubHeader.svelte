<script lang="ts">
  	import type { Place } from "$lib/type/place";
	import type { ZoneEditorState } from "../zoneState.svelte";

	let { state, backLink, place, isPreview = $bindable(false) }: { state: ZoneEditorState, backLink:string, place:Place, isPreview: boolean } = $props();
</script>

<div class="bg-[#f0f0f0] px-6 py-2.5 border-b border-slate-300 grid grid-cols-3">
	<div class="flex items-center">
		<a href={backLink}>
			<svg class="w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"/></svg>
		</a>
		<h1 class="text-base font-bold text-slate-900">แผนผังของ {place.name ? `${place.name} (${place.location.name})` : ''}</h1>
	</div>
	<label class="inline-flex cursor-pointer items-center justify-self-center">
			<input type="checkbox" bind:checked={isPreview} class="peer sr-only">

			<div class="
				relative h-6 w-11 rounded-full
				bg-gray-300
				transition-colors
				peer-checked:bg-blue-600
				peer-focus:outline-none
				peer-focus:ring-4
				peer-focus:ring-blue-300

				after:absolute
				after:left-[2px]
				after:top-[2px]
				after:h-5
				after:w-5
				after:rounded-full
				after:bg-white
				after:transition-transform
				peer-checked:after:translate-x-5
			"></div>

			<span class="ml-3 text-sm text-gray-700">
				Preview Zone
			</span>
			</label>
	<button 
        id="save-button"
		onclick={state.handleSaveButtonClick}
		disabled={state.overlappingIds.size > 0}
		class="px-6 py-1.5 bg-secondary hover:bg-secondary-hover justify-self-end text-white cursor-pointer font-medium text-sm rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
	>
		บันทึก
	</button>
</div>