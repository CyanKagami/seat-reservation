<script lang="ts">
  	import type { ZoneEditorState } from "../zoneState.svelte";

	let { zoneState, onOpenPopup }: { zoneState: ZoneEditorState, onOpenPopup: () => void } = $props();
	function handleRemoveZone(event: MouseEvent, zoneName: string) {
		zoneState.objects = zoneState.objects.map((obj) => {
			let metadata = obj.metadata
			if (metadata && metadata.zone && metadata.zone === zoneName) {
				delete metadata['zone'];
			}
			obj.metadata = metadata
			return obj
		})
		delete zoneState.zones[zoneName]
	}
</script>

<aside class="w-48 bg-[#f5f5f5] border-r border-slate-300 p-4 flex flex-col gap-3 shrink-0 select-none">
	<h2 class="text-xs font-bold text-slate-800">โซนที่นั่ง</h2>
		<button class="flex items-center rounded-md bg-accent hover:bg-accent-hover p-1 gap-2 text-white cursor-pointer" onclick={onOpenPopup}>
			<svg class="h-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>
			<span class='text-xs'>เพิ่มโซน</span>
		</button>
	
	<hr class="border-dim-gray mb-2">

	<div class="flex flex-col gap-1">
		<!-- Information Center -->
		{#each Object.entries(zoneState.zones) as [zoneName, zoneInfo]}
			<div 
				class="w-full flex items-center justify-between border group border-dashed border-slate-400 rounded bg-white gap-1 hover:bg-slate-50 transition-colors p-2"
			>
				<div class="w-full flex items-center gap-1">
					<div class="w-2 h-2" style={`background-color: ${zoneInfo.color};`}></div>
					<span class="text-[9px] text-slate-700 font-medium text-center leading-tight">{zoneName}</span>
				</div>
				<button class="w-3 h-3 hidden group-hover:block cursor-pointer" onclick={(e) => {handleRemoveZone(e, zoneName)}}>
					<svg class="fill-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>
				</button>
			</div>
		{/each}
	</div>
</aside>