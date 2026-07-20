<script lang="ts">
  import { onMount, untrack } from "svelte";
  import SeatEditor from "./SeatEditor.svelte";

	interface Point {
		x: number;
		y: number;
	}

	interface Square {
		id: string;
		x: number;
		y: number;
	}

	interface SeatingZone {
		id: string;
		name: string;
		points: Point[]; // Polygon vertices (relative to grid)
		color: string;
		squares: Square[];
	}

	const GRID_SIZE = 10;
	const CLOSE_SNAP_THRESHOLD = GRID_SIZE * 0.5;

	// Grid dimensions
	let gridWidth = $state(120);
	let gridHeight = $state(80);

	// Zoom and Pan
	let scale = $state(1.0);
	const MIN_SCALE = 0.5;
	const MAX_SCALE = 3.0;

	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });

	// Zone Context State
	let activeZoneId = $state<string | null>(null);
	let selectedZoneIds = $state<Set<string>>(new Set());

	// Polygon Creation Mode State
	let isDrawingMode = $state(false);
	let drawingPoints = $state<Point[]>([]);
	let hoverMousePos = $state<Point | null>(null);
	let isHoveringStartPoint = $state(false);

	// Initial Sample Zones
	let zones = $state<SeatingZone[]>([
		{ 
			id: crypto.randomUUID(), 
			name: "VIP Section A", 
			points: [
				{ x: 40, y: 40 },
				{ x: 280, y: 40 },
				{ x: 240, y: 220 },
				{ x: 40, y: 180 }
			], 
			color: "fill-amber-100/70 stroke-amber-500 hover:fill-amber-200/80 text-amber-900",
			squares: [
				{ id: crypto.randomUUID(), x: 20, y: 20 },
				{ id: crypto.randomUUID(), x: 60, y: 20 }
			]
		},
		{ 
			id: crypto.randomUUID(), 
			name: "Main Floor B", 
			points: [
				{ x: 320, y: 40 },
				{ x: 680, y: 40 },
				{ x: 680, y: 280 },
				{ x: 320, y: 280 }
			], 
			color: "fill-emerald-100/70 stroke-emerald-500 hover:fill-emerald-200/80 text-emerald-900",
			squares: [] 
		}
	]);

	// Dragging Mechanics
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let initialPositions = $state<Map<string, Point[]>>(new Map());

	// Selection Box
	let isBoxSelecting = $state(false);
	let boxStart = $state({ x: 0, y: 0 });
	let boxEnd = $state({ x: 0, y: 0 });
	let canvasElement = $state<HTMLDivElement | null>(null);

	let activeZone = $derived.by(() => {
		return zones.find(z => z.id === activeZoneId) || null;
	});

	// Compute zone dimensions based on polygon bounding box
	function getZoneBoundingBox(points: Point[]) {
		if (points.length === 0) return { width: 80, height: 60 };
		const xs = points.map(p => p.x);
		const ys = points.map(p => p.y);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);

		return {
			width: Math.max(1, Math.ceil((maxX - minX) / GRID_SIZE)),
			height: Math.max(1, Math.ceil((maxY - minY) / GRID_SIZE))
		};
	}

	onMount(() => {
		if (canvasElement) centerGrid();
	});

	function centerGrid() {
		if (!canvasElement) return;
		panX = (canvasElement.clientWidth - gridWidth * GRID_SIZE * scale) / 2;
		panY = (canvasElement.clientHeight - gridHeight * GRID_SIZE * scale) / 2;
	}

	// Dynamic Geometry Helpers
	function getCentroid(points: Point[]): Point {
		if (points.length === 0) return { x: 0, y: 0 };
		const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
		return { x: sum.x / points.length, y: sum.y / points.length };
	}

	function pointsToSvgString(points: Point[]): string {
		return points.map(p => `${p.x * scale + panX},${p.y * scale + panY}`).join(" ");
	}

	// Zoom features
	function zoomIn() { scale = Math.min(MAX_SCALE, scale + 0.1); }
	function zoomOut() { scale = Math.max(MIN_SCALE, scale - 0.1); }
	function resetZoom() { scale = 1.0; centerGrid(); }
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.deltaY < 0) zoomIn(); else zoomOut();
	}

	// Polygon Construction Handler
	function startDrawingMode() {
		isDrawingMode = true;
		drawingPoints = [];
		selectedZoneIds = new Set();
		isHoveringStartPoint = false;
	}

	function cancelDrawing() {
		isDrawingMode = false;
		drawingPoints = [];
		hoverMousePos = null;
		isHoveringStartPoint = false;
	}

	function finishPolygon() {
		if (drawingPoints.length < 3) return;

		const newZone: SeatingZone = {
			id: crypto.randomUUID(),
			name: `Zone ${zones.length + 1}`,
			points: [...drawingPoints],
			color: "fill-indigo-100/70 stroke-indigo-500 hover:fill-indigo-200/80 text-indigo-900",
			squares: []
		};

		zones = [...zones, newZone];
		selectedZoneIds = new Set([newZone.id]);
		cancelDrawing();
	}

	function removeSelected() {
		if (selectedZoneIds.size === 0) return;
		zones = zones.filter(z => !selectedZoneIds.has(z.id));
		selectedZoneIds = new Set();
	}

	// Mouse Event Processing
	function handleZoneMouseDown(zone: SeatingZone, event: MouseEvent) {
		if (isDrawingMode || event.button === 2) return; 
		event.stopPropagation();
		
		if (!selectedZoneIds.has(zone.id)) {
			selectedZoneIds = new Set([zone.id]);
		}

		isDragging = true;
		dragStart = { x: event.clientX, y: event.clientY };
		initialPositions.clear();
		zones.forEach(z => {
			if (selectedZoneIds.has(z.id)) {
				initialPositions.set(z.id, z.points.map(p => ({ ...p })));
			}
		});
	}

	function handleCanvasMouseDown(event: MouseEvent) {
		if (!canvasElement) return;

		if (event.button === 2) {
			isPanning = true;
			panStart = { x: event.clientX - panX, y: event.clientY - panY };
			return;
		}

		const rect = canvasElement.getBoundingClientRect();
		const rawX = (event.clientX - rect.left - panX) / scale;
		const rawY = (event.clientY - rect.top - panY) / scale;
		const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
		const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

		if (isDrawingMode) {
			// Complete polygon automatically if clicking back near the starting point
			if (drawingPoints.length >= 3 && isHoveringStartPoint) {
				finishPolygon();
				return;
			}

			drawingPoints = [...drawingPoints, { x: snappedX, y: snappedY }];
			return;
		}

		selectedZoneIds = new Set();
		isBoxSelecting = true;
		boxStart = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		boxEnd = { ...boxStart };
	}

	function handleMouseMove(event: MouseEvent) {
		if (!canvasElement) return;

		// Prioritize camera panning (Right-Click Drag) regardless of active mode
		if (isPanning) {
			panX = event.clientX - panStart.x;
			panY = event.clientY - panStart.y;
			return;
		}

		const rect = canvasElement.getBoundingClientRect();

		if (isDrawingMode) {
			const rawX = (event.clientX - rect.left - panX) / scale;
			const rawY = (event.clientY - rect.top - panY) / scale;
			const currentMousePos = {
				x: Math.round(rawX / GRID_SIZE) * GRID_SIZE,
				y: Math.round(rawY / GRID_SIZE) * GRID_SIZE
			};

			// Check proximity to initial vertex to complete shape
			if (drawingPoints.length >= 3) {
				const startPt = drawingPoints[0];
				const dist = Math.hypot(currentMousePos.x - startPt.x, currentMousePos.y - startPt.y);
				isHoveringStartPoint = dist <= CLOSE_SNAP_THRESHOLD;
				hoverMousePos = isHoveringStartPoint ? { ...startPt } : currentMousePos;
			} else {
				isHoveringStartPoint = false;
				hoverMousePos = currentMousePos;
			}
			return;
		}

		if (isDragging) {
			const dx = (event.clientX - dragStart.x) / scale;
			const dy = (event.clientY - dragStart.y) / scale;

			const gridDx = Math.round(dx / GRID_SIZE) * GRID_SIZE;
			const gridDy = Math.round(dy / GRID_SIZE) * GRID_SIZE;

			zones = zones.map(z => {
				const initialPts = initialPositions.get(z.id);
				if (!initialPts) return z;
				return {
					...z,
					points: initialPts.map(p => ({
						x: Math.max(0, Math.min(gridWidth * GRID_SIZE, p.x + gridDx)),
						y: Math.max(0, Math.min(gridHeight * GRID_SIZE, p.y + gridDy))
					}))
				};
			});
		} else if (isBoxSelecting) {
			boxEnd = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		}
	}

	function handleMouseUp() {
		isDragging = isBoxSelecting = isPanning = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			removeSelected();
		} else if (event.key === 'Escape' && isDrawingMode) {
			cancelDrawing();
		} else if (event.key === 'Enter' && isDrawingMode) {
			finishPolygon();
		}
	}
</script>

{#if activeZone}
	<!-- SEAT EDITOR SUB VIEW -->
	{@const bbox = getZoneBoundingBox(activeZone.points)}
	<SeatEditor 
		bind:zone={zones[zones.findIndex(z => z.id === activeZoneId)]} 
		zoneWidth={bbox.width}
		zoneHeight={bbox.height}
		onBack={() => activeZoneId = null}
	/>
{:else}
	<!-- PARENT POLYGON ZONE EDITOR WORKSPACE -->
	<div class="w-full max-w-4xl mx-auto flex flex-col gap-4 select-none">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-bold uppercase tracking-wider text-slate-700">Master Venue Floorplan</h2>
			<span class="text-xs text-slate-400 font-mono">{zones.length} Active Zones</span>
		</div>

		<!-- Toolbar -->
		<div class="flex flex-wrap justify-between items-center bg-slate-100 p-2 rounded-lg border border-slate-200 gap-2">
			<div class="flex items-center gap-2">
				{#if !isDrawingMode}
					<button onclick={startDrawingMode} class="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center gap-1.5">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>
						Draw Polygon Zone
					</button>
				{:else}
					<button onclick={finishPolygon} disabled={drawingPoints.length < 3} class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded transition-colors">
						Finish Polygon ({drawingPoints.length} pts)
					</button>
					<button onclick={cancelDrawing} class="px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors">
						Cancel [Esc]
					</button>
				{/if}

				<div class="flex items-center gap-1 text-slate-600 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs">
					<span class="font-medium text-[11px] uppercase tracking-wider text-slate-400 mr-1">Floor Grid:</span>
					<input type="number" bind:value={gridWidth} class="w-12 text-center bg-transparent border-none outline-none font-mono p-0" />
					<span class="text-slate-300 mx-0.5">×</span>
					<input type="number" bind:value={gridHeight} class="w-12 text-center bg-transparent border-none outline-none font-mono p-0" />
				</div>
			</div>

			<!-- Zoom Controls -->
			<div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5">
				<button onclick={zoomOut} class="px-2 py-1 text-xs font-bold hover:bg-slate-100 rounded text-slate-600">-</button>
				<button onclick={resetZoom} class="px-2 py-1 text-xs font-mono font-medium hover:bg-slate-100 rounded text-slate-700 min-w-[50px] text-center">{Math.round(scale * 100)}%</button>
				<button onclick={zoomIn} class="px-2 py-1 text-xs font-bold hover:bg-slate-100 rounded text-slate-600">+</button>
			</div>
			
			<button onclick={removeSelected} disabled={selectedZoneIds.size === 0 || isDrawingMode} class="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded disabled:opacity-50">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
			</button>
		</div>

		<!-- Main Workspace Canvas -->
		<div 
			bind:this={canvasElement}
			onwheel={handleWheel}
			ondblclick={finishPolygon}
			oncontextmenu={(e) => e.preventDefault()}
			class="w-full h-[500px] bg-slate-900 border border-slate-300 rounded-lg relative overflow-hidden outline-none focus:ring-1 focus:ring-slate-300"
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmousedown={handleCanvasMouseDown}
			onkeydown={handleKeyDown}
			tabindex="0"
			role="presentation"
		>
			<!-- Grid Sheet -->
			<div 
				class="absolute bg-white shadow-2xl pointer-events-none border border-slate-200"
				style="left: {panX}px; top: {panY}px; width: {gridWidth * GRID_SIZE * scale}px; height: {gridHeight * GRID_SIZE * scale}px;"
			>
				<div class="w-full h-full opacity-5" style="background-image: linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px); background-size: {GRID_SIZE * scale}px {GRID_SIZE * scale}px;"></div>
			</div>

			<svg class="w-full h-full absolute inset-0 pointer-events-none">
				<!-- EXISTING POLYGON ZONES -->
				{#each zones as zone (zone.id)}
					{@const isSelected = selectedZoneIds.has(zone.id)}
					{@const centroid = getCentroid(zone.points)}
					<g class="pointer-events-auto">
						<polygon 
							points={pointsToSvgString(zone.points)} 
							class="cursor-move stroke-2 transition-all duration-150 {zone.color} {isSelected ? 'ring-2 ring-indigo-500 stroke-indigo-600 shadow-lg' : 'shadow-sm'}"
							onmousedown={(e) => handleZoneMouseDown(zone, e)}
						/>

						<!-- Dynamic Label/Button at Centroid -->
						<foreignObject 
							x={centroid.x * scale + panX - 75} 
							y={centroid.y * scale + panY - 30} 
							width="150" 
							height="60" 
							class="pointer-events-none"
						>
							<div class="flex flex-col items-center justify-center text-center font-sans">
								<input 
									type="text" 
									bind:value={zone.name} 
									class="bg-white/80 backdrop-blur-xs border-none outline-none font-bold text-xs p-0.5 text-center pointer-events-auto text-slate-800 rounded shadow-xs focus:bg-white" 
									onmousedown={(e) => e.stopPropagation()}
								/>
								<button 
									onclick={() => activeZoneId = zone.id}
									class="mt-1 pointer-events-auto bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-medium shadow transition-colors cursor-pointer"
								>
									Configure Seats ({zone.squares.length}) &rarr;
								</button>
							</div>
						</foreignObject>
					</g>
				{/each}

				<!-- ACTIVE DRAWING POLYGON OVERLAY -->
				{#if isDrawingMode && drawingPoints.length > 0}
					<polyline 
						points={pointsToSvgString(drawingPoints)} 
						class="fill-none stroke-indigo-600 stroke-2" 
						style="stroke-dasharray: 4;"
					/>
					
					<!-- Rubber band line to mouse cursor -->
					{#if hoverMousePos}
						{@const lastPt = drawingPoints[drawingPoints.length - 1]}
						<line 
							x1={lastPt.x * scale + panX} 
							y1={lastPt.y * scale + panY} 
							x2={hoverMousePos.x * scale + panX} 
							y2={hoverMousePos.y * scale + panY} 
							class="{isHoveringStartPoint ? 'stroke-emerald-500 stroke-3' : 'stroke-indigo-400 stroke-2'}" 
							style="stroke-dasharray: {isHoveringStartPoint ? 'none' : '2'};"
						/>
					{/if}

					<!-- Draw Point Markers -->
					{#each drawingPoints as pt, index}
						{@const isStartPoint = index === 0}
						<circle 
							cx={pt.x * scale + panX} 
							cy={pt.y * scale + panY} 
							r={(isStartPoint && isHoveringStartPoint ? 7 : 4) * scale} 
							class="{isStartPoint && isHoveringStartPoint 
								? 'fill-emerald-500 stroke-white stroke-2 animate-pulse cursor-pointer' 
								: 'fill-indigo-600 stroke-white stroke-2'}" 
						/>
					{/each}
				{/if}
			</svg>
		</div>

		<p class="text-[11px] text-slate-400 text-center italic">
			{#if isDrawingMode}
				Click to add points. Click the <strong class="text-emerald-500">starting point</strong>, press <strong>Enter</strong>, or double click to complete the shape. Hold <strong>Right Mouse Button</strong> to pan.
			{:else}
				Click <strong>Draw Polygon Zone</strong> to create freeform polygon sections on the floorplan. Hold <strong>Right Mouse Button</strong> to pan.
			{/if}
		</p>
	</div>
{/if}