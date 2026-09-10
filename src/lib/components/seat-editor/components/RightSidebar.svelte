<script lang="ts">
	import type { SeatEditorState } from "../seatState.svelte";

	let { state }: { state: SeatEditorState } = $props();

	// ดึงรายการวัตถุที่กำลังถูกเลือก
	let selectedObjects = $derived(
		state.objects.filter((o) => state.selectedIds.has(o.id))
	);

	let hasSelection = $derived(selectedObjects.length > 0);
	let isSeatSelection = $derived(
		hasSelection && selectedObjects.every((o) => o.type === "seat")
	);
	let isShapeSelection = $derived(
		hasSelection && selectedObjects.every((o) => o.type !== "seat")
	);

	// ดึงค่าจาก obj.metadata
	let currentStatus = $derived(
		isSeatSelection && selectedObjects.every((o) => o.metadata?.status === selectedObjects[0].metadata?.status)
			? selectedObjects[0].metadata?.status ?? "available"
			: ""
	);

	let currentCharacteristic = $derived(
		isSeatSelection && selectedObjects.every((o) => o.metadata?.characteristic === selectedObjects[0].metadata?.characteristic)
			? selectedObjects[0].metadata?.characteristic ?? "standard"
			: ""
	);

	let currentColor = $derived(
		isShapeSelection && selectedObjects.every((o) => o.metadata?.color === selectedObjects[0].metadata?.color)
			? selectedObjects[0].metadata?.color ?? "#e2e8f0"
			: "มีหลายค่าเลือกอยู่"
	);

	function handleStatusChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		state.updateSelectedObjectMetadata({ status: target.value });
	}

	function handleCharacteristicChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		state.updateSelectedObjectMetadata({ characteristic: target.value });
	}

	function handleColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		state.updateSelectedObjectMetadata({ color: target.value });
	}
</script>

<aside class="w-64 border-l border-slate-300 bg-white flex flex-col h-full text-slate-800 shadow-sm z-10">
	<div class="px-4 py-3 border-b border-slate-200">
		<h2 class="font-semibold text-sm text-slate-700">คุณสมบัติ (Properties)</h2>
		{#if hasSelection}
			<p class="text-xs text-slate-500 mt-0.5">
				เลือกอยู่ {selectedObjects.length} รายการ
			</p>
		{/if}
	</div>

	<div class="p-4 flex-1 overflow-y-auto space-y-5">
		{#if !hasSelection}
			<div class="text-center py-8 text-slate-400 text-xs">
				เลือกที่นั่งหรือรูปทรงบนผืนผ้าใบเพื่อแก้ไขคุณสมบัติ
			</div>

		{:else if isSeatSelection}
			<!-- คุณสมบัติของที่นั่ง -->
			<div class="space-y-4">
				<div class="space-y-1.5">
					<label for="seat-status" class="text-xs font-medium text-slate-600 block">
						สถานะที่นั่ง
					</label>
					<select
						id="seat-status"
						value={currentStatus}
						onchange={handleStatusChange}
						class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						{#if !currentStatus}<option value="" disabled>มีหลายค่าเลือกอยู่</option>{/if}
						<option value="available">ว่าง (Available)</option>
						<option value="unavailable">ไม่พร้อมใช้งาน (Unavailable)</option>
					</select>
				</div>

				<div class="space-y-1.5">
					<label for="seat-char" class="text-xs font-medium text-slate-600 block">
						คุณลักษณะที่นั่ง
					</label>
					<select
						id="seat-char"
						value={currentCharacteristic}
						onchange={handleCharacteristicChange}
						class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						{#if !currentCharacteristic}<option value="" disabled>มีหลายค่าเลือกอยู่</option>{/if}
						<option value="standard">มาตรฐาน (Standard)</option>
						<option value="vip">วีไอพี (VIP)</option>
						<option value="restricted">มุมมองจำกัด (Restricted View)</option>
					</select>
				</div>
			</div>

		{:else if isShapeSelection}
			<!-- คุณสมบัติของรูปทรง -->
			<div class="space-y-4">
				<div class="space-y-1.5">
					<label for="shape-color" class="text-xs font-medium text-slate-600 block">
						สีพื้นหลัง (Fill Color)
					</label>
					<div class="flex items-center gap-2">
						<input
							type="color"
							id="shape-color"
							value={currentColor === 'มีหลายค่าเลือกอยู่' ? '#ffffff': currentColor}
							oninput={handleColorChange}
							class="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
						/>
						<span class="text-xs font-mono text-slate-600 uppercase">{currentColor}</span>
					</div>
				</div>
			</div>

		{:else}
			<div class="text-center py-8 text-slate-400 text-xs">
				มีการเลือกวัตถุผสมกัน (ที่นั่งและรูปทรง) กรุณาเลือกประเภทเดียวกันเพื่อแก้ไขพร้อมกัน
			</div>
		{/if}
	</div>
</aside>