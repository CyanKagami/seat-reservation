<script lang="ts">
	import type { CanvasObject } from "../types";

	let {
		zoneName = "เลือกที่นั่ง",
		seats = [],
		selectedSeatIds = $bindable([]),
		maxSeats = 6,
		onBack,
		onConfirm
	}: {
		zoneName?: string;
		seats: CanvasObject[];
		selectedSeatIds?: string[];
		maxSeats?: number;
		onBack?: () => void;
		onConfirm?: (selectedSeats: CanvasObject[]) => void;
	} = $props();

	// Calculate SVG ViewBox dynamically to wrap all seats in this zone tightly
	let viewBox = $derived.by(() => {
		if (!seats.length) return "0 0 800 600";

		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		seats.forEach((s) => {
			const x = s.x ?? 0;
			const y = s.y ?? 0;
			const w = s.width ?? 32;
			const h = s.height ?? 32;

			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x + w);
			maxY = Math.max(maxY, y + h);
		});

		const padding = 40;
		const width = Math.max(maxX - minX + padding * 2, 200);
		const height = Math.max(maxY - minY + padding * 2, 150);

		return `${minX - padding} ${minY - padding} ${width} ${height}`;
	});

	// Get full object details of selected seats
	let selectedSeats = $derived(
		seats.filter((s) => selectedSeatIds.includes(s.id))
	);

	function toggleSeat(seat: CanvasObject) {
		const status = seat.metadata?.status ?? "available";
		if (status !== "available") return;

		if (selectedSeatIds.includes(seat.id)) {
			selectedSeatIds = selectedSeatIds.filter((id) => id !== seat.id);
		} else {
			if (selectedSeatIds.length >= maxSeats) {
				alert(`เลือกได้สูงสุด ${maxSeats} ที่นั่ง`);
				return;
			}
			selectedSeatIds = [...selectedSeatIds, seat.id];
		}
	}

	function handleConfirm() {
		onConfirm?.(selectedSeats);
	}
</script>

<div class="flex flex-col w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
	<!-- Top Bar / Navigation Header -->
	<div class="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
		<button
			onclick={onBack}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
		>
			<svg class="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
				<path d="M15 18l-6-6 6-6" />
			</svg>
			กลับไปหน้าเลือกโซน
		</button>

		<div class="text-center">
			<h3 class="text-sm font-bold text-white">{zoneName}</h3>
			<p class="text-[11px] text-slate-400">
				เลือกแล้ว <span class="text-indigo-400 font-semibold">{selectedSeatIds.length}</span> / {maxSeats} ที่นั่ง
			</p>
		</div>

		<div class="w-[120px]"></div> <!-- Spacer for visual balance -->
	</div>

	<!-- Status Legend -->
	<div class="flex items-center justify-center gap-6 py-2 bg-slate-900/90 text-xs text-slate-300 border-b border-slate-800/60">
		<div class="flex items-center gap-2">
			<span class="w-3.5 h-3.5 rounded bg-indigo-600/30 border border-indigo-400"></span>
			<span>ว่าง</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
			<span>กำลังเลือก</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></span>
			<span>ไม่ว่าง</span>
		</div>
	</div>

	<!-- Seat Interactive Canvas Area -->
	<div class="flex-1 relative w-full h-full min-h-[350px] p-4 flex items-center justify-center overflow-auto">
		<svg
			viewBox={viewBox}
			preserveAspectRatio="xMidYMid meet"
			class="w-full h-full max-w-full max-h-full block select-none"
		>
			<g class="seats-layer">
				{#each seats as seat (seat.id)}
					{@const isSelected = selectedSeatIds.includes(seat.id)}
					{@const status = seat.metadata?.status ?? "available"}
					{@const isAvailable = status === "available"}
					{@const seatNumber = seat.metadata?.label || seat.metadata?.seatNo || ""}
					{@const x = seat.x ?? 0}
					{@const y = seat.y ?? 0}
					{@const w = seat.width ?? 28}
					{@const h = seat.height ?? 28}
					{@const cx = x + w / 2}
					{@const cy = y + h / 2}
					{@const rotation = seat.rotation ?? 0}

					<g
						transform={rotation ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
						onclick={() => toggleSeat(seat)}
						role="button"
						tabindex="0"
						class="transition-transform duration-150 {isAvailable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-40'}"
					>
						<!-- Seat Chair Body -->
						<rect
							{x}
							{y}
							width={w}
							height={h}
							rx={5}
							class="transition-all duration-200 
								{isSelected 
									? 'fill-emerald-500 stroke-white stroke-[2px] filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
									: isAvailable 
										? 'fill-indigo-900/60 stroke-indigo-400/80 stroke-[1.2px] hover:fill-indigo-600 hover:stroke-white' 
										: 'fill-slate-950 stroke-slate-800 stroke-1'}"
						/>

						<!-- Seat Cushion Line Details -->
						<rect
							x={x + 3}
							y={y + h - 8}
							width={w - 6}
							height={5}
							rx={2}
							class={isSelected ? 'fill-emerald-300' : isAvailable ? 'fill-indigo-400/40' : 'fill-slate-800'}
						/>

						<!-- Seat Label / Number -->
						{#if seatNumber}
							<text
								x={cx}
								y={cy - 1}
								text-anchor="middle"
								dominant-baseline="central"
								class="text-[10px] font-bold pointer-events-none fill-white tracking-tighter"
							>
								{seatNumber}
							</text>
						{/if}
					</g>
				{/each}
			</g>
		</svg>
	</div>

	<!-- Bottom Action Bar -->
	<div class="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
		<div class="flex flex-col">
			<span class="text-xs text-slate-400">ที่นั่งที่เลือก:</span>
			<div class="flex flex-wrap gap-1.5 mt-1 max-w-[300px]">
				{#if selectedSeats.length === 0}
					<span class="text-xs text-slate-500 italic">ยังไม่ได้เลือกที่นั่ง</span>
				{:else}
					{#each selectedSeats as s}
						<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
							{s.metadata?.label || s.id}
						</span>
					{/each}
				{/if}
			</div>
		</div>

		<button
			disabled={selectedSeatIds.length === 0}
			onclick={handleConfirm}
			class="px-5 py-2.5 rounded-lg font-semibold text-xs transition-all shadow-md
				{selectedSeatIds.length > 0 
					? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer shadow-emerald-500/20' 
					: 'bg-slate-800 text-slate-500 cursor-not-allowed'}"
		>
			ยืนยันการเลือก ({selectedSeatIds.length})
		</button>
	</div>
</div>