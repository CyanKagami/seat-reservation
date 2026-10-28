<script lang="ts">
	import type { ZoneEditorState } from "../zoneState.svelte";
	import type { SeatType } from "../types";
	import { getReservationSeatId, getSeatId } from "../utils/zoneUtils";
	import { alertModal } from "$lib/store/alert.svelte";

	let { zoneState, onOpenPopup }: { zoneState: ZoneEditorState, onOpenPopup: () => void } = $props();
	let previewSeatType = $state<SeatType | null>(null);

	let selectedObjects = $derived(
		zoneState.objects.filter((o) => zoneState.selectedIds.has(o.id))
	);
	let selectedSeatIds = $derived(
		selectedObjects.filter((object) => object.type === "seat").map((seat) => seat.id)
	);
	
	let hasSelection = $derived(selectedObjects.length > 0);

	let isSeatSelection = $derived(
		hasSelection && selectedObjects.every((o) => o.type === "seat")
	);

	let selectedSeatTypes = $derived.by(() => {
		const seatTypeCounts = new Map<string, { seatType: SeatType; count: number }>();

		for (const seat of selectedObjects) {
			const seatTypeKey = seat.metadata?.seatType ?? "standard";
			const seatType = zoneState.seatTypes[seatTypeKey] ?? {
				name: "standard",
				color: "#e2e8f0",
			};
			const existing = seatTypeCounts.get(seatTypeKey);

			if (existing) {
				existing.count += 1;
			} else {
				seatTypeCounts.set(seatTypeKey, {
					seatType,
					count: 1,
				});
			}
		}

		return Array.from(seatTypeCounts.values());
	});

	let isShapeSelection = $derived(
		hasSelection && selectedObjects.every((o) => o.type !== "seat")
	);

	let hasMixedZoneSelection = $derived(
		hasSelection && !selectedObjects.every((o) => {
			const cZone = o.metadata?.zone ?? '';
			const fZone = selectedObjects[0].metadata?.zone ?? '';
			return cZone === fZone;
		})
	);
	let currentZone = $derived(
		hasSelection && !hasMixedZoneSelection
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

	let currentSeatId = $derived(
		hasSelection && selectedObjects.every((o) => {
			return o.type === 'seat' && getSeatId(o) === getSeatId(selectedObjects[0]);
		})
			? getSeatId(selectedObjects[0])
			: ""
	);

	let currentReservationSeatId = $derived(
		selectedObjects.length === 1 && selectedObjects[0].type === 'seat'
			? getReservationSeatId(selectedObjects[0])
			: ''
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
		zoneState.updateSelectedObjectZone(target.value);
	}

	function handleAutoLabelSelected() {
		const seatIds = [...selectedSeatIds];
		if (seatIds.length === 0) return;

		const manualSeatsCount = zoneState.objects.filter(
			(object) => seatIds.includes(object.id) && object.metadata?.isManualLabel
		).length;

		alertModal.warning(
			"ยืนยันการจัดป้ายกำกับที่นั่งที่เลือก",
			manualSeatsCount > 0
				? `ระบบจะจัดป้ายกำกับที่นั่งที่เลือก ${seatIds.length} ที่นั่ง โดยมี ${manualSeatsCount} ที่นั่งที่กำหนดป้ายเอง`
				: `ระบบจะจัดป้ายกำกับที่นั่งที่เลือก ${seatIds.length} ที่นั่งใหม่โดยอัตโนมัติ`,
			{
				confirmText: "ดำเนินการต่อ",
				cancelText: "ยกเลิก",
				showCancel: true,
				onconfirm: () => {
					if (manualSeatsCount > 0) {
						alertModal.warning(
							"มีป้ายกำกับที่กำหนดเอง",
							`มีที่นั่งที่ล็อกป้ายเอง ${manualSeatsCount} ที่นั่ง ต้องการเขียนทับหรือไม่?`,
							{
								confirmText: "เขียนทับทั้งหมด",
								cancelText: "ข้ามที่นั่งที่กำหนดเอง",
								showCancel: true,
								onconfirm: () => zoneState.autoLabelSelectedSeats(seatIds, true),
								oncancel: () => zoneState.autoLabelSelectedSeats(seatIds, false)
							}
						);
					} else {
						zoneState.autoLabelSelectedSeats(seatIds, false);
					}
				}
			}
		);
	}

	function handleRemoveSelectedLabels() {
		const seatsWithLabels = zoneState.objects.filter(
			(object) => selectedSeatIds.includes(object.id) &&
				(object.metadata?.row || object.metadata?.seatNo)
		);
		const seatIds = seatsWithLabels.map((seat) => seat.id);
		if (seatIds.length === 0) return;

		alertModal.warning(
			"ยืนยันการลบป้ายกำกับ",
			`ต้องการลบป้ายกำกับแถวและเลขที่นั่งของที่นั่งที่เลือก ${seatIds.length} ที่นั่งหรือไม่?`,
			{
				confirmText: "ลบป้ายกำกับ",
				cancelText: "ยกเลิก",
				showCancel: true,
				onconfirm: () => zoneState.clearSeatLabels(seatIds)
			}
		);
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
				return {
					...obj,
					metadata: {
						...(obj.metadata || {}),
						row,
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
				return {
					...obj,
					metadata: {
						...(obj.metadata || {}),
						seatNo,
						isManualLabel: true
					}
				};
			}
			return obj;
		});
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

	async function copyReservationSeatId() {
		if (!currentReservationSeatId) return;
		try {
			await navigator.clipboard.writeText(currentReservationSeatId);
		} catch {
			alertModal.failure("คัดลอกรหัสไม่สำเร็จ", "ไม่สามารถคัดลอกรหัสที่นั่งได้ กรุณาลองอีกครั้ง");
		}
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
			<section class="space-y-2 border-b border-slate-200 pb-3" aria-labelledby="selected-seat-types">
				<h3 id="selected-seat-types" class="text-xs font-semibold text-slate-700">
					ประเภทที่นั่งที่เลือก
				</h3>
				<ul class="space-y-1.5">
					{#each selectedSeatTypes as { seatType, count } (seatType.name)}
						<li>
							<button
								type="button"
								onclick={() => (previewSeatType = seatType)}
								class="group flex w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer"
								aria-label={`ดูรูปภาพประเภทที่นั่ง ${seatType.name}`}
							>
								<span
									class="h-4 w-4 shrink-0 rounded border border-black/20"
									style={`background-color: ${seatType.color}`}
									aria-hidden="true"
								></span>
								<span class="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
									{seatType.name}
								</span>
								<span class="shrink-0 text-[10px] text-slate-500 group-hover:text-indigo-700">
									ดูรูปภาพ · {count} ที่นั่ง
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<!-- 1. Zone Selection -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<label for="zone-name" class="text-xs font-medium text-slate-600 block">
						โซน
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
					value={hasMixedZoneSelection ? "__mixed__" : currentZone}
					onchange={handleZoneChange}
					class="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					{#if hasMixedZoneSelection}<option value="__mixed__" disabled>มีหลายค่าเลือกอยู่</option>{/if}
					<option value="">ไม่มีโซน</option>
					{#each Object.entries(zoneState.zones) as [zoneName, zone]}
						<option value={zoneName}>{zoneName}</option>
					{/each}
				</select>
			</div>

			<!-- 2. Status Assignment (Available / Unavailable) -->
			<div class="space-y-1.5 border-t border-slate-200 pt-3">
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
					<option value="available">🟢 พร้อมใช้งาน</option>
					<option value="unavailable">🔴 ไม่พร้อมใช้งาน</option>
				</select>
			</div>

			<!-- 3. Seat Row & Number Labeling -->
			<div class="space-y-3 border-t border-slate-200 pt-3">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span class="text-xs font-semibold text-slate-700">ป้ายกำกับ</span>
					<div class="flex flex-wrap items-center gap-1">
						<button
							type="button"
							onclick={handleAutoLabelSelected}
							disabled={selectedSeatIds.length === 0}
							class="text-[11px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded border border-indigo-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
							title="จัดป้ายกำกับที่นั่งที่เลือกอัตโนมัติ"
						>
							ใส่ป้ายอัตโนมัติ ({selectedSeatIds.length})
						</button>
						<button
							type="button"
							onclick={handleRemoveSelectedLabels}
							disabled={!selectedSeatIds.some((seatId) => zoneState.objects.some(
								(object) => object.id === seatId && (object.metadata?.row || object.metadata?.seatNo)
							))}
							class="text-[11px] px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded border border-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
							title="ลบป้ายกำกับของที่นั่งที่เลือก"
						>
							ลบป้ายกำกับ
						</button>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div class="space-y-1">
						<label for="seat-row" class="text-[11px] font-medium text-slate-600 block">
							แถว
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
							เลขที่นั่ง
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
					<div class="flex items-center gap-1.5">
						<span class="font-mono font-bold text-slate-800">
							{currentSeatId || (selectedObjects.length > 1 ? '(หลายค่า)' : 'ยังไม่มีรหัส')}
						</span>
						{#if hasManualLabel}
							<span class="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5" title="ป้ายนี้ถูกล็อกไว้จากการรัน Auto Label">
								ล็อกป้ายเอง
							</span>
						{/if}
					</div>
				</div>


				{#if hasManualLabel}
					<div class="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-md border border-slate-200 text-slate-700">
						<div class="flex items-center justify-between">
							<span class="font-medium flex items-center gap-1">
								<svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/>
								</svg>
								ล็อกป้ายกำกับ (กำหนดเอง)
							</span>
							<button
								type="button"
								onclick={handleClearManualLabel}
								class="text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
								title="ปลดล็อกเพื่อให้ที่นั่งนี้สามารถถูกคำนวณใหม่เมื่อกด ใส่ป้ายกำกับอัตโนมัติ"
							>
								ปลดล็อก
							</button>
						</div>
						<p class="text-[11px] text-slate-500 leading-tight">
							ที่นั่งนี้ถูกล็อกไว้ จะไม่ถูกเปลี่ยนเมื่อกด <b>ใส่ป้ายกำกับอัตโนมัติ</b> (กดปลดล็อกหากต้องการให้จัดลำดับอัตโนมัติ)
						</p>
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
	<details class="border-t border-slate-200 px-4 py-3">
		<summary class="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-slate-700">
			ตัวเลือกขั้นสูง
		</summary>
		<div class="mt-2">
			<button
				type="button"
				onclick={zoneState.handleResetToPlaceLayout}
				disabled={zoneState.isSaving}
				class="text-left text-[11px] text-slate-500 transition-colors hover:text-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
				title="แทนที่ข้อมูลในตัวแก้ไขด้วยผังปัจจุบันของสถานที่"
			>
				{#if zoneState.isResetting}
					<span class="inline-flex items-center gap-1.5" aria-live="polite">
						<svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						กำลังโหลดผังจากสถานที่...
					</span>
				{:else}
					รีเซ็ตจากผังสถานที่
				{/if}
			</button>
			<p class="mt-1 text-[10px] leading-relaxed text-slate-400">
				แทนที่ข้อมูลในตัวแก้ไขด้วยผังปัจจุบันของสถานที่
			</p>
		</div>
	</details>
</aside>

{#if previewSeatType}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="seat-type-preview-title"
			tabindex="-1"
			class="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
		>
			<header class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
				<div class="flex min-w-0 items-center gap-2">
					<span
						class="h-4 w-4 shrink-0 rounded border border-black/20"
						style={`background-color: ${previewSeatType.color}`}
						aria-hidden="true"
					></span>
					<h2 id="seat-type-preview-title" class="truncate text-base font-semibold text-slate-800">
						{previewSeatType.name}
					</h2>
				</div>
				<button
					type="button"
					onclick={() => (previewSeatType = null)}
					class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer"
				>
					ปิด
				</button>
			</header>
			<div class="flex min-h-56 items-center justify-center bg-slate-50 p-5">
				{#if previewSeatType.picture}
					<img
						src={previewSeatType.picture}
						alt={`รูปภาพประเภทที่นั่ง ${previewSeatType.name}`}
						class="max-h-[65vh] max-w-full rounded-lg object-contain"
					/>
				{:else}
					<p class="text-sm text-slate-500">ประเภทที่นั่งนี้ยังไม่มีรูปภาพ</p>
				{/if}
			</div>
			{#if previewSeatType.description}
				<p class="px-5 py-4 text-sm text-slate-600">{previewSeatType.description}</p>
			{/if}
		</div>
	</div>
{/if}