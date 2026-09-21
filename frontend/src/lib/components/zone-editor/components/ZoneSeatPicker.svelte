<script lang="ts">
	import type { CanvasObject } from "../types";

	let {
		zoneName = "เลือกที่นั่ง",
		selectedZoneId = "",
		objects = [],
		selectedSeatIds = $bindable([]),
		maxSeats = 3,
		onBack,
		onConfirm
	}: {
		zoneName?: string;
		selectedZoneId?: string;
		objects: CanvasObject[];
		selectedSeatIds?: string[];
		maxSeats?: number;
		onBack?: () => void;
		onConfirm?: (selectedSeats: CanvasObject[]) => void;
	} = $props();

	// Helper to extract polygon relative points, centroid, and absolute bounds
	function getPolyData(obj: CanvasObject) {
		const screenX = obj.x ?? 0;
		const screenY = obj.y ?? 0;

		let rawPts: { x: number; y: number }[] = [];
		if (obj.points && Array.isArray(obj.points) && obj.points.length > 0) {
			if (typeof obj.points[0] === "number") {
				for (let i = 0; i < obj.points.length; i += 2) {
					rawPts.push({ x: Number(obj.points[i]), y: Number(obj.points[i + 1]) });
				}
			} else {
				rawPts = obj.points.map((p: any) => ({ x: Number(p.x), y: Number(p.y) }));
			}
		}

		const count = rawPts.length || 1;
		const centerRelX = rawPts.reduce((sum, p) => sum + p.x, 0) / count;
		const centerRelY = rawPts.reduce((sum, p) => sum + p.y, 0) / count;
		const relativeSvgPoints = rawPts.map((p) => `${p.x},${p.y}`).join(" ");

		// Calculate absolute bounding box
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		rawPts.forEach((p) => {
			const absX = screenX + p.x;
			const absY = screenY + p.y;
			minX = Math.min(minX, absX);
			minY = Math.min(minY, absY);
			maxX = Math.max(maxX, absX);
			maxY = Math.max(maxY, absY);
		});

		return {
			screenX,
			screenY,
			centerRelX,
			centerRelY,
			relativeSvgPoints,
			minX, minY, maxX, maxY
		};
	}

	// Auto-zoom ViewBox calculation focused on the selected zone
	let viewBox = $derived.by(() => {
		if (!objects.length) return "0 0 800 600";

		const zoneObjects = objects.filter(
			(s) => s.metadata?.zone === selectedZoneId || s.id === selectedZoneId
		);

		const targetObjects = zoneObjects.length > 0 ? zoneObjects : objects;

		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		targetObjects.forEach((s) => {
			const x = s.x ?? 0;
			const y = s.y ?? 0;
			const w = s.width ?? 32;
			const h = s.height ?? 32;

			if (s.points && Array.isArray(s.points) && s.points.length > 0) {
				const poly = getPolyData(s);
				minX = Math.min(minX, poly.minX);
				minY = Math.min(minY, poly.minY);
				maxX = Math.max(maxX, poly.maxX);
				maxY = Math.max(maxY, poly.maxY);
			} else {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x + w);
				maxY = Math.max(maxY, y + h);
			}
		});

		const padding = 60;
		const width = Math.max(maxX - minX + padding * 2, 240);
		const height = Math.max(maxY - minY + padding * 2, 180);

		return `${minX - padding} ${minY - padding} ${width} ${height}`;
	});

	// Currently selected seats objects
	let selectedSeats = $derived(
		objects.filter((s) => s.type === "seat" && selectedSeatIds.includes(s.id))
	);

	function toggleSeat(seat: CanvasObject) {
		const isZoneSeat = seat.metadata?.zone === selectedZoneId;
		const status = seat.metadata?.status ?? "available";

		if (!isZoneSeat || status === "unavailable") return;

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
</script>

<div class="flex flex-col w-full h-full bg-white rounded-xl overflow-hidden shadow-xl border border-slate-200">
	<!-- Top Bar (Responsive Grid Layout) -->
	<div class="grid grid-cols-3 items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 border-b border-slate-200">
		<button
			onclick={onBack}
			class="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
		>
			<svg class="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
				<path d="M15 18l-6-6 6-6" />
			</svg>
			<span class="hidden xs:inline sm:inline">กลับไปหน้าเลือกโซน</span>
			<span class="inline xs:hidden sm:hidden">กลับ</span>
		</button>

		<div class="text-center px-1 overflow-hidden">
			<h3 class="text-xs sm:text-sm font-bold text-slate-800 truncate">{zoneName}</h3>
			<p class="text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap">
				เลือกแล้ว <span class="text-indigo-600 font-bold">{selectedSeatIds.length}</span> / {maxSeats} ที่นั่ง
			</p>
		</div>

		<div class="w-6 sm:w-16"></div>
	</div>

	<!-- Status Legend (Responsive Wrap) -->
	<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-3 py-2 bg-slate-50 text-[11px] sm:text-xs text-slate-600 border-b border-slate-200">
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-indigo-200 border border-indigo-500"></span>
			<span>ว่าง</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-indigo-300 border border-indigo-600 ring-1 ring-indigo-400"></span>
			<span>กำลังเลือก</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-stone-700 border border-stone-600"></span>
			<span>ไม่ว่าง</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-slate-200 border border-slate-300 opacity-40"></span>
			<span>นอกโซนที่เลือก</span>
		</div>
	</div>

	<!-- Canvas Viewport (Responsive Height & SVG Aspect Scaler) -->
	<div class="relative flex-1 w-full h-full min-h-[320px] sm:min-h-[450px] bg-white select-none overflow-hidden flex items-center justify-center">
		<svg
			viewBox={viewBox}
			preserveAspectRatio="xMidYMid meet"
			class="w-full h-full max-w-full max-h-full block select-none relative z-10 transition-all duration-500 ease-out"
		>
			{#each objects as obj (obj.id)}
				{@const screenX = obj.x ?? 0}
				{@const screenY = obj.y ?? 0}
				{@const screenWidth = obj.width ?? 28}
				{@const screenHeight = obj.height ?? 28}
				{@const centerX = screenX + screenWidth / 2}
				{@const centerY = screenY + screenHeight / 2}
				{@const isZoneObject = obj.metadata?.zone === selectedZoneId || obj.id === selectedZoneId}

				<!-- 1. SEATS -->
				{#if obj.type === 'seat'}
					{@const isSelected = selectedSeatIds.includes(obj.id)}
					{@const status = obj.metadata?.status ?? 'available'}
					{@const seatLabel = obj.metadata?.label || obj.metadata?.seatNo || obj.id.replace('seat_', '') || ''}

					{@const statusClasses = !isZoneObject
						? 'fill-slate-200 stroke-slate-300 opacity-25'
						: status === 'unavailable'
							? (isSelected ? 'fill-stone-900 stroke-stone-900 ring-2 ring-indigo-400' : 'fill-stone-700 stroke-stone-600')
							: status === 'held'
								? (isSelected ? 'fill-amber-300 stroke-amber-600 ring-2 ring-indigo-400' : 'fill-amber-200 stroke-amber-500 hover:fill-amber-300')
								: (isSelected ? 'fill-indigo-300 stroke-indigo-600 ring-2 ring-indigo-400' : 'fill-indigo-200 stroke-indigo-500 hover:fill-indigo-300')}

					<g 
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						onclick={() => toggleSeat(obj)}
						role="button"
						tabindex="0"
						class="transition-colors focus:outline-none 
							{!isZoneObject 
								? 'pointer-events-none' 
								: status === 'unavailable' 
									? 'cursor-not-allowed opacity-60 pointer-events-auto' 
									: 'cursor-pointer pointer-events-auto'}"
					>
						<rect 
							x={screenX} 
							y={screenY} 
							width={screenWidth} 
							height={screenHeight} 
							rx={1}
							class="stroke-1 transition-colors {statusClasses}"
						/>

						{#if seatLabel && isZoneObject}
							<text
								x={centerX}
								y={centerY}
								text-anchor="middle"
								dominant-baseline="central"
								class="text-[10px] font-bold pointer-events-none tracking-tighter fill-slate-800"
							>
								{seatLabel}
							</text>
						{/if}
					</g>

				<!-- 2. ENVIRONMENT RECT -->
				{:else if obj.type === 'env-rect'}
					<rect 
						x={screenX} 
						y={screenY} 
						width={screenWidth} 
						height={screenHeight} 
						rx={2}
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						style="fill: {isZoneObject ? (obj.metadata?.color ?? '#e2e8f0') : '#e2e8f0'};"
						class="stroke-2 pointer-events-none transition-all {isZoneObject ? 'stroke-slate-500 opacity-90' : 'stroke-slate-300 opacity-25'}"
					/>

				<!-- 3. ENVIRONMENT CIRCLE -->
				{:else if obj.type === 'env-circle'}
					<ellipse 
						cx={centerX} 
						cy={centerY} 
						rx={screenWidth / 2} 
						ry={screenHeight / 2} 
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						style="fill: {isZoneObject ? (obj.metadata?.color ?? '#e2e8f0') : '#e2e8f0'};"
						class="stroke-2 pointer-events-none transition-all {isZoneObject ? 'stroke-slate-500 opacity-90' : 'stroke-slate-300 opacity-25'}"
					/>

				<!-- 4. ENVIRONMENT POLYGON -->
				{:else if obj.type === 'env-polygon' && obj.points}
					{@const poly = getPolyData(obj)}
					<g 
						transform="translate({poly.screenX}, {poly.screenY}) rotate({obj.rotation ?? 0}, {poly.centerRelX}, {poly.centerRelY})"
						class="pointer-events-none transition-all {isZoneObject ? 'opacity-90' : 'opacity-25'}"
					>
						<polygon 
							points={poly.relativeSvgPoints} 
							style="fill: {isZoneObject ? (obj.metadata?.color ?? '#e2e8f0') : '#e2e8f0'};"
							class="stroke-2 {isZoneObject ? 'stroke-slate-500' : 'stroke-slate-300'}"
						/>
					</g>

				<!-- 5. ENVIRONMENT ICON POLYGON -->
				{:else if obj.type === 'env-icon-polygon' && obj.points}
					{@const poly = getPolyData(obj)}
					<g 
						transform="translate({poly.screenX}, {poly.screenY}) rotate({obj.rotation ?? 0}, {poly.centerRelX}, {poly.centerRelY})"
						class="pointer-events-none transition-all {isZoneObject ? 'opacity-100' : 'opacity-30'}"
					>
						<polygon 
							points={poly.relativeSvgPoints} 
							style="fill: {isZoneObject ? (obj.metadata?.color ?? '#e2e8f0') : '#e2e8f0'};"
							class="stroke-2 {isZoneObject ? 'stroke-slate-500' : 'stroke-slate-300'}"
						/>
						<foreignObject 
							x={poly.centerRelX - 40} 
							y={poly.centerRelY - 30} 
							width={80} 
							height={60}
							class="pointer-events-none overflow-visible"
						>
							<div class="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-800">
								{#if obj.iconType === 'toilet'}
									<svg class="w-5 h-5 stroke-slate-800 fill-none" viewBox="0 0 24 24" stroke-width="1.8">
										<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-3-3"/><circle cx="19" cy="8" r="2"/>
									</svg>
								{:else if obj.iconType === 'entrance'}
									<svg class="w-5 h-5 fill-slate-800" viewBox="0 0 24 24">
										<path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-8h-2V9h2v2z"/>
									</svg>
								{:else if obj.iconType === 'stage'}
									<svg class="w-5 h-5 stroke-slate-800 fill-none" viewBox="0 0 24 24" stroke-width="1.8">
										<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
									</svg>
								{/if}
								{#if obj.label}
									<span class="text-xs font-semibold text-slate-800 whitespace-nowrap">{obj.label}</span>
								{/if}
							</div>
						</foreignObject>
					</g>
				{/if}
			{/each}
		</svg>
	</div>

	<!-- Bottom Action Bar (Stack Vertically on Mobile) -->
	<div class="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
		<div class="flex flex-col">
			<span class="text-[11px] sm:text-xs font-medium text-slate-500">ที่นั่งที่เลือก:</span>
			<div class="flex flex-wrap gap-1.5 mt-1 max-h-16 overflow-y-auto">
				{#if selectedSeats.length === 0}
					<span class="text-xs text-slate-400 italic">ยังไม่ได้เลือกที่นั่ง</span>
				{:else}
					{#each selectedSeats as s}
						<span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-300 text-[11px] font-semibold">
							{s.metadata?.label || s.id}
						</span>
					{/each}
				{/if}
			</div>
		</div>

		<button
			disabled={selectedSeatIds.length === 0}
			onclick={() => onConfirm?.(selectedSeats)}
			class="w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm shrink-0
				{selectedSeatIds.length > 0 
					? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-indigo-200' 
					: 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
		>
			ยืนยันการเลือก ({selectedSeatIds.length})
		</button>
	</div>
</div>