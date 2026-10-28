<script lang="ts">
	import type { SeatEditorState } from "../seatState.svelte";
	import type { SeatType } from "../types";

	let {
		seatState,
		onOpenCreatePopup,
		onOpenEditPopup
	}: {
		seatState: SeatEditorState;
		onOpenCreatePopup: () => void;
		onOpenEditPopup: (seatType: SeatType) => void;
	} = $props();

	function handleDragStart(event: DragEvent, iconType: string, label: string) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('iconType', iconType);
		event.dataTransfer.setData('label', label);
		event.dataTransfer.effectAllowed = 'copy';
	}

	function handleApplySeatType(typeName: string) {
		if (seatState.selectedIds.size === 0) return;
		seatState.updateSelectedObjectMetadata({ seatType: typeName });
	}

	function handleRemoveSeatType(event: MouseEvent, typeName: string) {
		event.stopPropagation();
		if (confirm(`คุณต้องการลบประเภทที่นั่ง "${typeName}" หรือไม่?`)) {
			seatState.removeSeatType(typeName);
		}
	}

	function handleEditSeatType(event: MouseEvent, seatType: SeatType) {
		event.stopPropagation();
		onOpenEditPopup(seatType);
	}
</script>

<aside class="w-52 bg-[#f5f5f5] border-r border-slate-300 p-4 flex flex-col gap-3 shrink-0 select-none overflow-y-auto max-h-full">
	
	<!-- 2. Elements Section -->
	<div class="flex flex-col gap-2">
		<h2 class="text-xs font-bold text-slate-800">องค์ประกอบ</h2>
		<div class="flex gap-2">
			<!-- Toilet -->
			<div 
				draggable="true"
				ondragstart={(e) => handleDragStart(e, 'toilet', 'ห้องน้ำ')}
				class="w-12 h-14 border border-dashed border-slate-400 rounded bg-white flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors"
			>
				<svg class="w-5 h-5 stroke-slate-800 fill-none pointer-events-none" viewBox="0 0 24 24" stroke-width="1.8">
					<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-3-3"/><circle cx="19" cy="8" r="2"/>
				</svg>
				<span class="text-[10px] text-slate-700 font-medium pointer-events-none">ห้องน้ำ</span>
			</div>

			<!-- Entrance -->
			<div 
				draggable="true"
				ondragstart={(e) => handleDragStart(e, 'entrance', 'ประตู')}
				class="w-12 h-14 border border-dashed border-slate-400 rounded bg-white flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors"
			>
				<svg class="w-5 h-5 fill-slate-800 pointer-events-none" viewBox="0 0 24 24">
					<path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-8h-2V9h2v2z"/>
				</svg>
				<span class="text-[10px] text-slate-700 font-medium pointer-events-none">ประตู</span>
			</div>

			<!-- Stage -->
			<div 
				draggable="true"
				ondragstart={(e) => handleDragStart(e, 'stage', 'เวที')}
				class="w-12 h-14 border border-dashed border-slate-400 rounded bg-white flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors"
			>
				<svg class="w-5 h-5 stroke-slate-800 fill-none pointer-events-none" viewBox="0 0 24 24" stroke-width="1.8">
					<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
				</svg>
				<span class="text-[10px] text-slate-700 font-medium pointer-events-none">เวที</span>
			</div>
		</div>
	</div>
	<hr class="border-slate-300 my-1" />

	<!-- 1. Seat Types Section -->
	<div class="flex flex-col gap-2">
	<h2 class="text-xs font-bold text-slate-800">ประเภทที่นั่ง</h2>
		<button
			type="button"
			disabled={seatState.isSaving}
			class="flex items-center rounded-md bg-accent hover:bg-accent-hover p-1.5 gap-2 text-white cursor-pointer transition-colors shadow-xs"
			onclick={onOpenCreatePopup}
		>
			<svg class="h-3.5 w-3.5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
				<path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/>
			</svg>
			<span class="text-xs font-medium">เพิ่มประเภทที่นั่ง</span>
		</button>

		<div class="flex flex-col gap-1 mt-1">
			{#each Object.entries(seatState.seatTypes) as [typeName, seatType]}
				{@const seatCount = seatState.objects.filter((o) => o.type === 'seat' && (o.metadata?.seatType || 'standard') === typeName).length}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleApplySeatType(typeName)}
					onkeydown={(e) => e.key === 'Enter' && handleApplySeatType(typeName)}
					class="w-full flex items-center justify-between border group border-slate-300 rounded bg-white gap-1 hover:bg-indigo-50 hover:border-indigo-400 transition-colors p-2 cursor-pointer"
					title="คลิกเพื่อกำหนดประเภทที่นั่งที่เลือกให้เป็น {typeName}"
				>
					<div class="flex items-center gap-1.5 min-w-0">
						{#if seatType.picture}
							<img src={seatType.picture} alt={typeName} class="w-3.5 h-3.5 rounded-xs object-cover shrink-0 border border-slate-200" />
						{:else}
							<div class="w-2.5 h-2.5 rounded-xs shrink-0 border border-slate-200" style={`background-color: ${seatType.color || '#e2e8f0'};`}></div>
						{/if}
						<div class="flex flex-col min-w-0">
							<span class="text-[10px] text-slate-800 font-semibold truncate leading-tight">
								{typeName === 'standard' ? 'มาตรฐาน (Standard)' : typeName}
							</span>
							<span class="text-[8px] text-slate-400">{seatCount} ที่นั่ง</span>
						</div>
					</div>

					{#if typeName !== 'standard'}
						<div class="flex items-center gap-1 shrink-0">
							<!-- Edit Button -->
							<button
								type="button"
								disabled={seatState.isSaving}
								title="แก้ไขประเภทที่นั่ง"
								class="w-4 h-4 hidden group-hover:flex items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-600 rounded transition-colors"
								onclick={(e) => handleEditSeatType(e, seatType)}
							>
								<svg class="w-3 h-3 fill-current" viewBox="0 0 24 24">
									<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
								</svg>
							</button>

							<!-- Delete Button -->
							<button
								type="button"
								disabled={seatState.isSaving}
								title="ลบประเภทที่นั่ง"
								class="w-4 h-4 hidden group-hover:flex items-center justify-center cursor-pointer text-slate-400 hover:text-red-500 rounded transition-colors"
								onclick={(e) => handleRemoveSeatType(e, typeName)}
							>
								<svg class="fill-current w-2.5 h-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
									<path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/>
								</svg>
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</aside>