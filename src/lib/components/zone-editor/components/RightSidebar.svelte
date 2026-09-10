<script lang="ts">
	import type { ZoneEditorState } from "../zoneState.svelte";

	let { zoneState, onOpenPopup }: { zoneState: ZoneEditorState, onOpenPopup: () => void } = $props();

	let selectedObjects = $derived(
		zoneState.objects.filter((o) => zoneState.selectedIds.has(o.id))
	);
	
	let hasSelection = $derived(selectedObjects.length > 0);

	let currentZone = $derived(
		hasSelection && selectedObjects.every((o) => {
			const currentZone = o.metadata  ? (o.metadata.zone ?? ''): ''
			const firstZone = selectedObjects[0].metadata  ? (selectedObjects[0].metadata.zone ?? ''): ''
			return currentZone == firstZone;
		})
			? selectedObjects[0].metadata  ? (selectedObjects[0].metadata.zone ?? 'ไม่มีโซน') : 'ไม่มีโซน'
			: ""
	);


	function handleZoneChange(e: Event) {
		const target = e.target as HTMLInputElement;
		// Update object label name across selections
		zoneState.updateSelectedObjectMetadata({zone : target.value });
		console.log(zoneState.zones)
	}

	function handleColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		zoneState.updateSelectedObjectMetadata({ color: target.value });
	}

</script>

<aside class="w-64 border-l border-slate-300 bg-white flex flex-col h-full text-slate-800 shadow-sm z-10">
	<div class="px-4 py-3 border-b border-slate-200">
		<h2 class="font-semibold text-sm text-slate-700">ตั้งค่าโซน</h2>
	</div>

	<div class="p-4 flex-1 overflow-y-auto space-y-4 flex flex-col justify-between">
		{#if !hasSelection}
			<div class="text-center py-8 text-slate-400 text-xs">
				เลือกที่นั่งบนแผนที่เพื่อกำหนดโซน
			</div>
		{:else}
			<!-- Zone / Icon Name Input -->
			<div class="space-y-1.5">
					<label for="zone-name" class="text-xs font-medium text-slate-600 block">
						โซน
					</label>

					<select
						id="zone-name"
						value={currentZone}
						onchange={handleZoneChange}
						class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						{#if !currentZone}<option value="" disabled>มีหลายค่าเลือกอยู่</option>{/if}
						{#each Object.entries(zoneState.zones) as [zoneName, zone], i}
							<option value={zoneName}>{zoneName}</option>
						{/each}
					</select>
			</div>

		{/if}

	</div>
</aside>