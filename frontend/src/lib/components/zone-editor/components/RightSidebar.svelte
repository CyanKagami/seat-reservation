<script lang="ts">
	import type { ZoneEditorState } from "../zoneState.svelte";

	let { zoneState, onOpenPopup }: { zoneState: ZoneEditorState, onOpenPopup: () => void } = $props();

	let selectedObjects = $derived(
		zoneState.objects.filter((o) => zoneState.selectedIds.has(o.id))
	);
	
	let hasSelection = $derived(selectedObjects.length > 0);

	let isSeatSelection = $derived(
		hasSelection && selectedObjects.every((o) => o.type === "seat")
	);

	let isShapeSelection = $derived(
		hasSelection && selectedObjects.every((o) => o.type !== "seat")
	);

	let currentZone = $derived(
		hasSelection && selectedObjects.every((o) => {
			const cZone = o.metadata?.zone ?? '';
			const fZone = selectedObjects[0].metadata?.zone ?? '';
			return cZone === fZone;
		})
			? (selectedObjects[0].metadata?.zone ?? '')
			: ""
	);

	let currentStatus = $derived(
		hasSelection && selectedObjects.every((o) => {
			const cStatus = o.metadata?.status ?? 'available';
			const fStatus = selectedObjects[0].metadata?.status ?? 'available';
			return cStatus === fStatus;
		})
			? (selectedObjects[0].metadata?.status ?? 'available')
			: ""
	);

	let currentRow = $derived(
		hasSelection && selectedObjects.every((o) => {
			const cRow = o.metadata?.row ?? '';
			const fRow = selectedObjects[0].metadata?.row ?? '';
			return cRow === fRow;
		})
			? (selectedObjects[0].metadata?.row ?? '')
			: ""
	);

	let currentSeatNo = $derived(
		hasSelection && selectedObjects.every((o) => {
			const cNo = o.metadata?.seatNo ?? '';
			const fNo = selectedObjects[0].metadata?.seatNo ?? '';
			return cNo === fNo;
		})
			? (selectedObjects[0].metadata?.seatNo ?? '')
			: ""
	);

	let currentLabel = $derived(
		hasSelection && selectedObjects.every((o) => {
			const cLabel = o.metadata?.label ?? '';
			const fLabel = selectedObjects[0].metadata?.label ?? '';
			return cLabel === fLabel;
		})
			? (selectedObjects[0].metadata?.label ?? '')
			: ""
	);

	let hasManualLabel = $derived(
		hasSelection && selectedObjects.some((o) => o.metadata?.isManualLabel)
	);

	let currentColor = $derived(
		isShapeSelection && selectedObjects.every((o) => o.metadata?.color === selectedObjects[0].metadata?.color)
			? selectedObjects[0].metadata?.color ?? "#e2e8f0"
			: "มีหลายค่าเลือกอยู่"
	);

	function handleZoneChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		zoneState.updateSelectedObjectMetadata({ zone: target.value });
	}

	function handleStatusChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		zoneState.updateSelectedObjectMetadata({ status: target.value });
	}

	function handleRowChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const row = target.value.trim().toUpperCase();
		zoneState.objects = zoneState.objects.map((obj) => {
			if (zoneState.selectedIds.has(obj.id)) {
				const seatNo = obj.metadata?.seatNo ?? '';
				const label = row && seatNo ? `${row}${seatNo}` : (row || seatNo || '');
				return {
					...obj,
					metadata: {
						...(obj.metadata || {}),
						row,
						label,
						isManualLabel: true
					}
				};
			}
			return obj;
		});
	}

	function handleSeatNoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const seatNo = target.value.trim();
		zoneState.objects = zoneState.objects.map((obj) => {
			if (zoneState.selectedIds.has(obj.id)) {
				const row = obj.metadata?.row ?? '';
				const label = row && seatNo ? `${row}${seatNo}` : (row || seatNo || '');
				return {
					...obj,
					metadata: {
						...(obj.metadata || {}),
						seatNo,
						label,
						isManualLabel: true
					}
				};
			}
			return obj;
		});
	}

	function handleAutoLabel() {
		const targetZone = currentZone || selectedObjects.find((o) => o.metadata?.zone)?.metadata?.zone;
		if (!targetZone) {
			alert('กรุณากำหนดโซนให้ที่นั่งก่อนสร้างป้ายกำกับอัตโนมัติ');
			return;
		}
		zoneState.autoLabelZone(targetZone, false);
	}

	function handleClearManualLabel() {
		zoneState.objects = zoneState.objects.map((obj) => {
			if (zoneState.selectedIds.has(obj.id)) {
				const newMeta = { ...(obj.metadata || {}) };
				delete newMeta.isManualLabel;
				return { ...obj, metadata: newMeta };
			}
			return obj;
		});
	}

	function handleColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		zoneState.updateSelectedObjectMetadata({ color: target.value });
	}
</script>

<aside class="w-64 border-l border-slate-300 bg-white flex flex-col h-full text-slate-800 shadow-sm z-10">
	<div class="px-4 py-3 border-b border-slate-200">
		<h2 class="font-semibold text-sm text-slate-700">คุณสมบัติ (Properties)</h2>
		{#if hasSelection}
			<p class="text-xs text-slate-500 mt-0.5">
				เลือกอยู่ {selectedObjects.length} {isSeatSelection ? 'ที่นั่ง' : 'รายการ'}
			</p>
		{/if}
	</div>

	<div class="p-4 flex-1 overflow-y-auto space-y-4">
		{#if !hasSelection}
			<div class="text-center py-8 text-slate-400 text-xs">
				เลือกที่นั่งหรือวัตถุบนผืนผ้าใบเพื่อตั้งค่า
			</div>
		{:else if isSeatSelection}
			<!-- 1. Zone Selection -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<label for="zone-name" class="text-xs font-medium text-slate-600 block">
						โซน (Zone)
					</label>
					<button
						onclick={onOpenPopup}
						type="button"
						class="text-[11px] text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium"
					>
						+ เพิ่มโซน
					</button>
				</div>

				<select
					id="zone-name"
					value={currentZone}
					onchange={handleZoneChange}
					class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					{#if !currentZone}<option value="" disabled>มีหลายค่าเลือกอยู่ หรือยังไม่มีโซน</option>{/if}
					{#each Object.entries(zoneState.zones) as [zoneName, zone]}
						<option value={zoneName}>{zoneName}</option>
					{/each}
				</select>
			</div>

			<!-- 2. Status Assignment (Available / Unavailable) -->
			<div class="space-y-1.5 border-t border-slate-200 pt-3">
				<label for="seat-status" class="text-xs font-medium text-slate-600 block">
					สถานะที่นั่ง (Status)
				</label>
				<select
					id="seat-status"
					value={currentStatus}
					onchange={handleStatusChange}
					class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					{#if !currentStatus}<option value="" disabled>มีหลายค่าเลือกอยู่</option>{/if}
					<option value="available">🟢 พร้อมใช้งาน (Available)</option>
					<option value="unavailable">🔴 ไม่พร้อมใช้งาน (Unavailable)</option>
				</select>
			</div>

			<!-- 3. Seat Row & Number Labeling -->
			<div class="space-y-3 border-t border-slate-200 pt-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-slate-700">ป้ายกำกับ (Labeling)</span>
					<button
						type="button"
						onclick={handleAutoLabel}
						class="text-[11px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded border border-indigo-200 transition-colors cursor-pointer"
						title="จัดลำดับแถว (A, B, C...) และเลขที่นั่ง (1, 2, 3...) อัตโนมัติตามตำแหน่ง"
					>
						Auto Label โซน
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div class="space-y-1">
						<label for="seat-row" class="text-[11px] font-medium text-slate-600 block">
							แถว (Row)
						</label>
						<input
							id="seat-row"
							type="text"
							value={currentRow}
							oninput={handleRowChange}
							placeholder={selectedObjects.length > 1 ? "หลายแถว" : "เช่น A"}
							class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
					<div class="space-y-1">
						<label for="seat-no" class="text-[11px] font-medium text-slate-600 block">
							เลขที่นั่ง (No.)
						</label>
						<input
							id="seat-no"
							type="text"
							value={currentSeatNo}
							oninput={handleSeatNoChange}
							placeholder={selectedObjects.length > 1 ? "หลายเลข" : "เช่น 1"}
							class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
				</div>

				<div class="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs flex items-center justify-between">
					<span class="text-slate-500">ป้ายปัจจุบัน:</span>
					<span class="font-mono font-bold text-slate-800">
						{currentLabel || (selectedObjects.length > 1 ? '(หลายค่า)' : 'ยังไม่มีป้าย')}
					</span>
				</div>

				{#if hasManualLabel}
					<div class="flex items-center justify-between text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
						<span>มีป้ายที่ระบุด้วยตนเอง</span>
						<button
							type="button"
							onclick={handleClearManualLabel}
							class="underline hover:text-amber-900 cursor-pointer"
						>
							ปลดล็อค
						</button>
					</div>
				{/if}
			</div>

		{:else if isShapeSelection}
			<!-- Environment Shapes Color -->
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
				มีการเลือกวัตถุหลายประเภทผสมกัน กรุณาเลือกเฉพาะที่นั่งเพื่อตั้งค่าโซนและป้ายกำกับ
			</div>
		{/if}
	</div>
</aside>