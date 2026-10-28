<script lang="ts">
	import { onMount } from "svelte";
	import type { CanvasObject } from "../types";
	import type { SeatType } from "$lib/components/canvas-shared/types";
  import { getReservationSeatId, getSeatId } from "../utils/zoneUtils";

	const NO_ZONE_ID = "zone-no-zone";

	let {
		selectedZoneId = "",
		objects = [],
		seatTypes = {},
		selectedSeatIds = $bindable([]),
		maxSeats = 1,
		reservedIds = new Set(),
		myReservedIds = new Set(),
		onConfirm
	}: {
		selectedZoneId?: string;
		objects: CanvasObject[];
		seatTypes?: Record<string, SeatType>;
		selectedSeatIds?: string[];
		maxSeats?: number;
		reservedIds: Set<string>;
		myReservedIds?: Set<string>;
		onConfirm?: (selectedSeats: CanvasObject[]) => void;
	} = $props();

	function belongsToSelectedZone(seat: CanvasObject) {
		return selectedZoneId === NO_ZONE_ID
			? !seat.metadata?.zone
			: seat.metadata?.zone === selectedZoneId;
	}

	let isSmallScreen = $state(false);
	let pickerContainer: HTMLDivElement;
	let svgElement: SVGSVGElement;
	let zoomLevel = $state(1);
	let viewCenterX: number | null = $state(null);
	let viewCenterY: number | null = $state(null);
	let pinchStart: {
		distance: number;
		zoom: number;
		focalX: number;
		focalY: number;
		midpointX: number;
		midpointY: number;
	} | null = null;
	onMount(() => {
		const mediaQuery = window.matchMedia("(max-width: 639px)");
		const updateScreenSize = () => (isSmallScreen = mediaQuery.matches);
		updateScreenSize();
		mediaQuery.addEventListener("change", updateScreenSize);
		pickerContainer.addEventListener("touchmove", handleTouchMove, { passive: false });
		return () => {
			mediaQuery.removeEventListener("change", updateScreenSize);
			pickerContainer.removeEventListener("touchmove", handleTouchMove);
		};
	});

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

	// Keep the viewport centered on seats; environment objects provide context but never expand it.
	let baseViewBox = $derived.by(() => {
		if (!objects.length) return "0 0 800 600";

		const zoneSeats = objects.filter(
			(object) => object.type === 'seat' && belongsToSelectedZone(object)
		);

		const targetSeats = zoneSeats.length > 0
			? zoneSeats
			: objects.filter((object) => object.type === 'seat');
		if (targetSeats.length === 0) return "0 0 800 600";

		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		targetSeats.forEach((seat) => {
			const x = seat.x ?? 0;
			const y = seat.y ?? 0;
			const w = seat.width ?? 32;
			const h = seat.height ?? 32;

			if (seat.points && Array.isArray(seat.points) && seat.points.length > 0) {
				const poly = getPolyData(seat);
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
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;

		return `${centerX - width / 2} ${centerY - height / 2} ${width} ${height}`;
	});

	let viewBox = $derived.by(() => {
		const [baseX, baseY, baseWidth, baseHeight] = baseViewBox.split(/\s+/).map(Number);
		const width = baseWidth / zoomLevel;
		const height = baseHeight / zoomLevel;
		const centerX = viewCenterX ?? baseX + baseWidth / 2;
		const centerY = viewCenterY ?? baseY + baseHeight / 2;
		return `${centerX - width / 2} ${centerY - height / 2} ${width} ${height}`;
	});

	function handleTouchStart(event: TouchEvent) {
		if (!isSmallScreen || event.touches.length !== 2 || !svgElement) return;

		const [first, second] = Array.from(event.touches);
		const rect = svgElement.getBoundingClientRect();
		const [viewX, viewY, viewWidth, viewHeight] = viewBox.split(/\s+/).map(Number);
		const midpointX = (first.clientX + second.clientX) / 2 - rect.left;
		const midpointY = (first.clientY + second.clientY) / 2 - rect.top;
		const normalizedX = midpointX / rect.width;
		const normalizedY = midpointY / rect.height;

		pinchStart = {
			distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
			zoom: zoomLevel,
			focalX: viewX + normalizedX * viewWidth,
			focalY: viewY + normalizedY * viewHeight,
			midpointX: normalizedX,
			midpointY: normalizedY
		};
	}

	function handleTouchMove(event: TouchEvent) {
		if (!pinchStart || event.touches.length !== 2) return;
		event.preventDefault();

		const [first, second] = Array.from(event.touches);
		const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
		const nextZoom = Math.min(5, Math.max(1, pinchStart.zoom * distance / pinchStart.distance));
		const [baseX, baseY, baseWidth, baseHeight] = baseViewBox.split(/\s+/).map(Number);
		const viewWidth = baseWidth / nextZoom;
		const viewHeight = baseHeight / nextZoom;
		const svgRect = svgElement.getBoundingClientRect();
		const nextMidpointX = ((first.clientX + second.clientX) / 2 - svgRect.left) / svgRect.width;
		const nextMidpointY = ((first.clientY + second.clientY) / 2 - svgRect.top) / svgRect.height;
		const normalizedX = Number.isFinite(nextMidpointX) ? nextMidpointX : pinchStart.midpointX;
		const normalizedY = Number.isFinite(nextMidpointY) ? nextMidpointY : pinchStart.midpointY;

		zoomLevel = nextZoom;
		if (nextZoom === 1) {
			viewCenterX = null;
			viewCenterY = null;
		} else {
			viewCenterX = pinchStart.focalX + (0.5 - normalizedX) * viewWidth;
			viewCenterY = pinchStart.focalY + (0.5 - normalizedY) * viewHeight;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (event.touches.length < 2) pinchStart = null;
	}

	// Currently selected seats objects
	let selectedSeats = $derived(
		objects.filter((s) => s.type === "seat" && selectedSeatIds.includes(s.id))
	);
	let visibleSeatTypes = $derived.by(() => {
		const zoneSeatTypes = new Map<string, SeatType>();
		for (const seat of objects) {
			if (seat.type !== 'seat' || !belongsToSelectedZone(seat) || (seat.metadata?.status ?? 'available') !== 'available') {
				continue;
			}
			const key = seat.metadata?.seatType ?? 'standard';
			const seatType = seatTypes[key] ?? { name: key, color: '#e2e8f0' };
			if (seatType.name !== 'standard') zoneSeatTypes.set(key, seatType);
		}
		return [...zoneSeatTypes.values()].sort((a, b) => a.name.localeCompare(b.name));
	});

	function toggleSeat(seat: CanvasObject) {
		const isZoneSeat = belongsToSelectedZone(seat);
		const status = seat.metadata?.status ?? "available";
		const reservationId = getReservationSeatId(seat);
		const isReserved = reservedIds.has(reservationId);

		if (!isZoneSeat || status === "unavailable" || isReserved) return;


		if (selectedSeatIds.includes(seat.id)) {
			selectedSeatIds = selectedSeatIds.filter((id) => id !== seat.id);
		} else {
			if (selectedSeatIds.length >= maxSeats) {
				selectedSeatIds.shift();
			}
			selectedSeatIds = [...selectedSeatIds, seat.id];
		}
	}
</script>

<div class="flex flex-col w-full h-full bg-white rounded-xl overflow-hidden shadow-xl border border-slate-200">
	<!-- Status Legend (Responsive Wrap) -->
	<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-3 py-2 bg-slate-50 text-[11px] sm:text-xs text-slate-600 border-b border-slate-200">
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-indigo-200 border border-indigo-500"></span>
			<span>ว่าง</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-indigo-500 border border-indigo-600 ring-2 ring-indigo-400"></span>
			<span>กำลังเลือก</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-stone-700 border border-stone-900"></span>
			<span>ถูกจองแล้ว</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-slate-200 border border-slate-300 opacity-25"></span>
			<span>นอกโซนที่เลือก</span>
		</div>
	</div>

	<!-- Canvas Viewport (Responsive Height & SVG Aspect Scaler) -->
	<div
		bind:this={pickerContainer}
		class="relative flex-1 w-full h-full min-h-0 bg-white select-none overflow-hidden flex items-center justify-center overscroll-contain touch-pan-x touch-pan-y"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		ontouchcancel={handleTouchEnd}
	>
		<svg
			bind:this={svgElement}
			viewBox={viewBox}
			preserveAspectRatio="xMidYMid meet"
			class="block h-full w-full select-none relative z-10 transition-all duration-200 ease-out"
		>
			{#each objects as obj (obj.id)}
				{@const screenX = obj.x ?? 0}
				{@const screenY = obj.y ?? 0}
				{@const screenWidth = obj.width ?? 28}
				{@const screenHeight = obj.height ?? 28}
				{@const centerX = screenX + screenWidth / 2}
				{@const centerY = screenY + screenHeight / 2}
				{@const isZoneObject = belongsToSelectedZone(obj) && (obj.metadata?.status ?? 'available') === 'available'}

				<!-- 1. SEATS -->
				{#if obj.type === 'seat'}
					{@const isSelected = selectedSeatIds.includes(obj.id)}
					{@const status = obj.metadata.status ?? 'available'}
					{@const seatId = getSeatId(obj)}
					{@const reservationId = getReservationSeatId(obj)}
					{@const seatTypeKey = obj.metadata.seatType ?? 'standard'}
					{@const seatType = seatTypes[seatTypeKey] ?? { name: seatTypeKey, color: '#e2e8f0' }}
					{@const isReserved = reservedIds.has(reservationId)}
					{@const isMine = myReservedIds.has(reservationId)}

					{@const statusClasses = !isZoneObject
						? 'fill-slate-200 stroke-slate-300 opacity-25'
						: status === 'unavailable'
							? 'fill-stone-700 stroke-stone-600'
							: isMine
								? 'fill-emerald-500 stroke-emerald-600 ring-2 ring-emerald-400'
							: isReserved
								? 'fill-stone-700 stroke-stone-900'
								: (isSelected ? 'fill-indigo-500 stroke-indigo-600 ring-2 ring-indigo-400' : 'fill-indigo-200 stroke-indigo-500 hover:fill-indigo-300')}

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
						<title>{seatId}{seatType.name ? ` · ${seatType.name}` : ''}</title>
						<rect 
							x={screenX} 
							y={screenY} 
							width={screenWidth} 
							height={screenHeight} 
							rx={1}
							class="stroke-1 transition-colors {statusClasses}"
						/>

						{#if isZoneObject && seatType.name !== 'standard'}
							<rect
								x={screenX + 1}
								y={screenY + 1}
								width={Math.max(0, screenWidth - 2)}
								height={Math.max(2, Math.min(5, screenHeight * 0.18))}
								rx={1}
								fill={seatType.color || '#e2e8f0'}
								class="pointer-events-none"
							/>
						{/if}

						{#if seatId && isZoneObject}
							<text
								x={centerX}
								y={centerY}
								text-anchor="middle"
								dominant-baseline="central"
								transform="rotate({-(obj.rotation ?? 0)}, {centerX}, {centerY})"
								class="text-[10px] font-bold pointer-events-none tracking-tighter {status === 'unavailable' || isReserved ? 'fill-white' : 'fill-slate-800'}"
							>
								{seatId}
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
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="stroke-2 stroke-slate-500 pointer-events-none opacity-90"
					/>

				<!-- 3. ENVIRONMENT CIRCLE -->
				{:else if obj.type === 'env-circle'}
					<ellipse 
						cx={centerX} 
						cy={centerY} 
						rx={screenWidth / 2} 
						ry={screenHeight / 2} 
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="stroke-2 stroke-slate-500 pointer-events-none opacity-90"
					/>

				<!-- 4. ENVIRONMENT POLYGON -->
				{:else if obj.type === 'env-polygon' && obj.points}
					{@const poly = getPolyData(obj)}
					<g 
						transform="translate({poly.screenX}, {poly.screenY}) rotate({obj.rotation ?? 0}, {poly.centerRelX}, {poly.centerRelY})"
						class="pointer-events-none opacity-90"
					>
						<polygon 
							points={poly.relativeSvgPoints} 
							style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
							class="stroke-2 stroke-slate-500"
						/>
					</g>

				<!-- 5. ENVIRONMENT ICON POLYGON -->
				{:else if obj.type === 'env-icon-polygon' && obj.points}
					{@const poly = getPolyData(obj)}
					<g 
						transform="translate({poly.screenX}, {poly.screenY}) rotate({obj.rotation ?? 0}, {poly.centerRelX}, {poly.centerRelY})"
						class="pointer-events-none opacity-100"
					>
						<polygon 
							points={poly.relativeSvgPoints} 
							style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
							class="stroke-2 stroke-slate-500"
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

		{#if visibleSeatTypes.length > 0}
			<aside
				class="pointer-events-none absolute left-3 top-3 z-20 max-w-[min(14rem,calc(100%-1.5rem))] rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm"
				aria-label="Seat type legend"
			>
				<h4 class="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">ประเภทที่นั่ง</h4>
				<ul class="flex flex-col gap-1.5">
					{#each visibleSeatTypes as seatType (seatType.name)}
						<li class="flex min-w-0 items-center gap-2 text-xs text-slate-700">
							<span
								class="h-3 w-3 shrink-0 rounded-sm border border-slate-300"
								style={`background-color: ${seatType.color || '#e2e8f0'}`}
								aria-hidden="true"
							></span>
							<span class="truncate" title={seatType.name}>{seatType.name}</span>
						</li>
					{/each}
				</ul>
			</aside>
		{/if}
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
						{@const seatTypeKey = s.metadata?.seatType ?? 'standard'}
						{@const seatType = seatTypes[seatTypeKey] ?? { name: seatTypeKey, color: '#e2e8f0' }}
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-300 text-[11px] font-semibold">
							{#if seatType.name !== 'standard'}
								<span class="h-2 w-2 rounded-sm shrink-0" style={`background-color: ${seatType.color}`} aria-hidden="true"></span>
							{/if}
							{getSeatId(s)}{seatType.name ? ` · ${seatType.name}` : ''}
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