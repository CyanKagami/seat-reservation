<script lang="ts">
	import type { SeatEditorState } from "../seatState.svelte";

	let { state }: { state: SeatEditorState } = $props();

	let selectedObjects = $derived(
		state.objects.filter((o) => state.selectedIds.has(o.id))
	);

	let hasSelection = $derived(selectedObjects.length > 0);

	let currentName = $derived(
		hasSelection && selectedObjects.every((o) => o.label === selectedObjects[0].label)
			? selectedObjects[0].label ?? ""
			: ""
	);

	let currentColor = $derived(
		hasSelection && selectedObjects.every((o) => o.metadata?.color === selectedObjects[0].metadata?.color)
			? selectedObjects[0].metadata?.color ?? "#818cf8"
			: "#818cf8"
	);

	function handleNameChange(e: Event) {
		const target = e.target as HTMLInputElement;
		// Update object label name across selections
		selectedObjects.forEach((obj) => {
			obj.label = target.value;
		});
	}

	function handleColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		state.updateSelectedObjectMetadata({ color: target.value });
	}
</script>

<aside class="w-64 border-l border-slate-300 bg-white flex flex-col h-full text-slate-800 shadow-sm z-10">
	<div class="px-4 py-3 border-b border-slate-200">
		<h2 class="font-semibold text-sm text-slate-700">ตั้งค่าโซน / จุดบริการ</h2>
	</div>

	<div class="p-4 flex-1 overflow-y-auto space-y-4">
		{#if !hasSelection}
			<div class="text-center py-8 text-slate-400 text-xs">
				เลือกโซนหรือไอคอนบนแผนผังเพื่อตั้งชื่อ
			</div>
		{:else}
			<!-- Zone / Icon Name Input -->
			<div class="space-y-1.5">
				<label for="zone-name" class="text-xs font-medium text-slate-600 block">
					ชื่อโซน / ข้อความกำกับ
				</label>
				<input
					id="zone-name"
					type="text"
					value={currentName}
					placeholder="เช่น โซน VIP A, จุดประชาสัมพันธ์"
					oninput={handleNameChange}
					class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>

			<!-- Color Picker -->
			<div class="space-y-1.5">
				<label for="zone-color" class="text-xs font-medium text-slate-600 block">
					สีไฮไลท์โซน
				</label>
				<div class="flex items-center gap-2">
					<input
						type="color"
						id="zone-color"
						value={currentColor}
						oninput={handleColorChange}
						class="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
					/>
					<span class="text-xs font-mono text-slate-600 uppercase">{currentColor}</span>
				</div>
			</div>
		{/if}
	</div>
</aside>