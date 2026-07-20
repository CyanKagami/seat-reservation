<script lang="ts">
  import { onMount, untrack } from "svelte";

	interface Square {
		id: string;
		x: number;
		y: number;
	}

	interface Point {
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

	interface Props {
		zoneWidth?: number;
		zoneHeight?: number;
		zone?: SeatingZone;
		onBack: () => null | void;
	}

	let { zoneWidth = 80, zoneHeight = 60, zone = $bindable(), onBack }: Props = $props();

	const BOX_SIZE = 20; 
	const GRID_SIZE = 10;

	// Finite grid parameters initialized from zone size
	let gridWidth = $state(zoneWidth * 2);
	let gridHeight = $state(zoneHeight * 2);
	const STARTING_WIDTH = gridWidth;
	const STARTING_HEIGHT = gridHeight;

	// Zoom state management runes
	let scale = $state(1.0);
	const MIN_SCALE = 0.5;
	const MAX_SCALE = 3.0;

	// Panning state (in plain view space pixels to match render space)
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });

	// Initialize squares from zone prop or fallback to default
	let squares = $state<Square[]>(
		zone?.squares && zone.squares.length > 0 
			? zone.squares 
			: [
				{ id: crypto.randomUUID(), x: 40, y: 40 },
				{ id: crypto.randomUUID(), x: 160, y: 40 }
			]
	);

	// Keep parent zone state updated with latest seats
	$effect(() => {
		if (zone) {
			zone.squares = squares;
		}
	});
	
	let selectedIds = $state<Set<string>>(new Set(squares.length > 0 ? [squares[0].id] : []));
	let copiedSquares = $state<Square[]>([]);

	// Dragging mechanics
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let initialPositions = $state<Map<string, { x: number; y: number }>>(new Map());

	// Box Selection (Marquee) state
	let isBoxSelecting = $state(false);
	let boxStart = $state({ x: 0, y: 0 });
	let boxEnd = $state({ x: 0, y: 0 });
	let canvasElement = $state<HTMLDivElement | null>(null);

	// Automatically push boxes back inward if grid sizing decreases below their positions
	$effect(() => {
		moveSquareOnOutOfBound(gridWidth, gridHeight);
	});

	function moveSquareOnOutOfBound(gridWidth: number, gridHeight: number) {
		const maxX = gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = gridHeight * GRID_SIZE - BOX_SIZE;
		squares = untrack(() => 
			squares.map(s => {
				if (s.x > maxX || s.y > maxY) {
					return {
						id: s.id,
						x: Math.max(0, Math.min(maxX, s.x)),
						y: Math.max(0, Math.min(maxY, s.y))
					};
				}
				return s;
			})
		);
	}

	// Automatically center the grid once the canvas element mounts and is rendered
	onMount(() => {
		if (canvasElement) {
			centerGrid();
		}
	});

	function centerGrid() {
		if (!canvasElement) return;
		panX = (canvasElement.clientWidth - gridWidth * GRID_SIZE * scale) / 2;
		panY = (canvasElement.clientHeight - gridHeight * GRID_SIZE * scale) / 2;
	}

	// Derived marquee rectangle boundary coordinates in view space
	let marqueeRect = $derived(() => {
		if (!isBoxSelecting) return null;
		const x = Math.min(boxStart.x, boxEnd.x);
		const y = Math.min(boxStart.y, boxEnd.y);
		const width = Math.abs(boxStart.x - boxEnd.x);
		const height = Math.abs(boxStart.y - boxEnd.y);
		return { x, y, width, height };
	});

	let overlappingIds = $derived(() => {
		const overlaps = new Set<string>();
		for (let i = 0; i < squares.length; i++) {
			for (let j = i + 1; j < squares.length; j++) {
				if (Math.abs(squares[i].x - squares[j].x) <= GRID_SIZE && Math.abs(squares[i].y - squares[j].y) <= GRID_SIZE) {
					overlaps.add(squares[i].id);
					overlaps.add(squares[j].id);
				}
			}
		}
		return overlaps;
	});

	// Zoom adjustments
	function zoomIn() {
		scale = Math.min(MAX_SCALE, scale + 0.1);
	}

	function zoomOut() {
		scale = Math.max(MIN_SCALE, scale - 0.1);
	}

	function resetZoom() {
		scale = 1.0;
		centerGrid();
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	function addSquare() {
		const targetX = Math.round(((-panX + 60) / scale) / GRID_SIZE) * GRID_SIZE;
		const targetY = Math.round(((-panY + 60) / scale) / GRID_SIZE) * GRID_SIZE;
		
		const newSquare: Square = {
			id: crypto.randomUUID(),
			x: Math.max(0, Math.min(gridWidth * GRID_SIZE - BOX_SIZE, targetX)),
			y: Math.max(0, Math.min(gridHeight * GRID_SIZE - BOX_SIZE, targetY))
		};
		squares = [...squares, newSquare];
		selectedIds = new Set([newSquare.id]);
	}

	function removeSelected() {
		if (selectedIds.size === 0) return;
		squares = squares.filter(s => !selectedIds.has(s.id));
		selectedIds = new Set();
	}

	function copySelected() {
		if (selectedIds.size === 0) return;
		copiedSquares = squares
			.filter(s => selectedIds.has(s.id))
			.map(s => ({ ...s }));
	}

	function pasteSquares() {
		if (copiedSquares.length === 0) return;
		
		const nextBatch: Square[] = [];
		const nextSelected = new Set<string>();

		copiedSquares.forEach(src => {
			const newId = crypto.randomUUID();
			const targetX = src.x + GRID_SIZE * 2;
			const targetY = src.y + GRID_SIZE * 2;
			
			nextBatch.push({
				id: newId,
				x: Math.max(0, Math.min(gridWidth * GRID_SIZE - BOX_SIZE, targetX)),
				y: Math.max(0, Math.min(gridHeight * GRID_SIZE - BOX_SIZE, targetY))
			});
			nextSelected.add(newId);
		});

		squares = [...squares, ...nextBatch];
		selectedIds = nextSelected;
		copiedSquares = nextBatch.map(s => ({ ...s }));
	}

	function handleSquareMouseDown(square: Square, event: MouseEvent) {
		if (event.button === 2) return; 
		event.stopPropagation();
		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;

		if (hasModifier) {
			if (selectedIds.has(square.id)) {
				selectedIds.delete(square.id);
				selectedIds = new Set(selectedIds);
			} else {
				selectedIds = new Set([...selectedIds, square.id]);
			}
		} else {
			if (!selectedIds.has(square.id)) {
				selectedIds = new Set([square.id]);
			}
		}

		isDragging = true;
		dragStart = { x: event.clientX, y: event.clientY };
		
		initialPositions.clear();
		squares.forEach(s => {
			if (selectedIds.has(s.id)) {
				initialPositions.set(s.id, { x: s.x, y: s.y });
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

		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;
		if (!hasModifier) {
			selectedIds = new Set();
		}

		const rect = canvasElement.getBoundingClientRect();
		const clientX = event.clientX - rect.left;
		const clientY = event.clientY - rect.top;

		isBoxSelecting = true;
		boxStart = { x: clientX, y: clientY };
		boxEnd = { x: clientX, y: clientY };
	}

	function handleMouseMove(event: MouseEvent) {
		if (isPanning) {
			panX = event.clientX - panStart.x;
			panY = event.clientY - panStart.y;
		} else if (isDragging) {
			const dx = (event.clientX - dragStart.x) / scale;
			const dy = (event.clientY - dragStart.y) / scale;

			squares = squares.map(s => {
				const initial = initialPositions.get(s.id);
				if (initial) {
					let rawX = initial.x + dx;
					let rawY = initial.y + dy;
					
					let snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
					let snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
					
					return {
						...s,
						x: Math.max(0, Math.min(gridWidth * GRID_SIZE - BOX_SIZE, snappedX)),
						y: Math.max(0, Math.min(gridHeight * GRID_SIZE - BOX_SIZE, snappedY))
					};
				}
				return s;
			});
		} else if (isBoxSelecting && canvasElement) {
			const rect = canvasElement.getBoundingClientRect();
			
			boxEnd = { 
				x: event.clientX - rect.left, 
				y: event.clientY - rect.top 
			};

			const box = marqueeRect();
			if (box) {
				const currentSelection = new Set<string>();
				squares.forEach(s => {
					const screenX = s.x * scale + panX;
					const screenY = s.y * scale + panY;
					const screenBoxSize = BOX_SIZE * scale;

					const intersects = !(screenX > box.x + box.width || 
                                          screenX + screenBoxSize < box.x || 
                                          screenY > box.y + box.height || 
                                          screenY + screenBoxSize < box.y);
					if (intersects) {
						currentSelection.add(s.id);
					}
				});
				selectedIds = currentSelection;
			}
		}
	}

	function handleMouseUp() {
		isDragging = false;
		isBoxSelecting = false;
		isPanning = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			removeSelected();
			return;
		}

		const isModifier = event.ctrlKey || event.metaKey;
		if (!isModifier) return;

		if (event.key.toLowerCase() === 'c') {
			event.preventDefault();
			copySelected();
		} else if (event.key.toLowerCase() === 'v') {
			event.preventDefault();
			pasteSquares();
		}
	}

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault(); 
	}
</script>

<div class="w-full max-w-3xl mx-auto flex flex-col gap-4">
	<!-- Breadcrumb & Header Bar -->
	<div class="flex flex-col gap-1.5 border-b border-slate-200 pb-3">
		<!-- Breadcrumb Navigation -->
		<nav class="flex items-center gap-1.5 text-xs text-slate-500">
			<button 
				onclick={onBack}
				class="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1"
			>
				All Zones
			</button>
			<span class="text-slate-300">/</span>
			<span class="text-slate-800 font-semibold">{zone?.name || "Zone Editor"}</span>
		</nav>

		<!-- Header Details with Back Arrow & Zone Info -->
		<div class="flex items-center gap-3">
			<button 
				onclick={onBack}
				class="p-1.5 rounded-lg hover:bg-slate-200/80 bg-slate-100 text-slate-700 transition-colors flex items-center justify-center shrink-0 border border-slate-200"
				title="Back to Zone Editor"
				aria-label="Back to Zone Editor"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="19" y1="12" x2="5" y2="12"></line>
					<polyline points="12 19 5 12 12 5"></polyline>
				</svg>
			</button>

			{#if zone?.color}
				<span 
					class="w-3 h-3 rounded-full shadow-sm shrink-0 border border-black/10" 
					style="background-color: {zone.color}"
				></span>
			{/if}
			<h1 class="text-lg font-bold text-slate-900 tracking-tight">
				{zone?.name || "Zone Editor Workspace"}
			</h1>
			<span class="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
				{squares.length} Seat{squares.length === 1 ? '' : 's'}
			</span>
		</div>
	</div>

	<!-- Toolbar Actions -->
	<div class="flex flex-wrap justify-between items-center bg-slate-100 p-2 rounded-lg border border-slate-200 select-none gap-2">
		<div class="flex items-center gap-2">
			<button 
				onclick={addSquare} 
				class="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center gap-1.5"
				title="Add New Square"
				aria-label="Add Square"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
				Square
			</button>

			<!-- Editable Finite Grid Dimension Workspace Controls -->
			<div class="flex items-center gap-1 text-slate-600 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs">
				<span class="font-medium text-[11px] uppercase tracking-wider text-slate-400 mr-1">Grid:</span>
				<input 
					type="number" 
					bind:value={gridWidth} 
					step={1}
					min={STARTING_WIDTH}
					max={3000}
					class="w-12 text-center bg-transparent border-none outline-none focus:ring-0 font-mono p-0"
					title="Grid Width (px)"
				/>
				<span class="text-slate-300 mx-0.5">×</span>
				<input 
					type="number" 
					bind:value={gridHeight} 
					step={1}
					min={STARTING_HEIGHT}
					max={3000}
					class="w-12 text-center bg-transparent border-none outline-none focus:ring-0 font-mono p-0"
					title="Grid Height (px)"
				/>
				<span class="text-slate-400 font-mono text-[10px] ml-0.5">px</span>
			</div>
		</div>

		<!-- Zoom Control Interface Sub-Group -->
		<div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5">
			<button onclick={zoomOut} class="px-2 py-1 text-xs font-bold hover:bg-slate-100 rounded text-slate-600" title="Zoom Out">-</button>
			<button onclick={resetZoom} class="px-2 py-1 text-xs font-mono font-medium hover:bg-slate-100 rounded text-slate-700 min-w-[50px] text-center" title="Reset Camera View">
				{Math.round(scale * 100)}%
			</button>
			<button onclick={zoomIn} class="px-2 py-1 text-xs font-bold hover:bg-slate-100 rounded text-slate-600" title="Zoom In">+</button>
		</div>
		
		<div class="flex gap-2">
			<button 
				onclick={copySelected}
				disabled={selectedIds.size === 0}
				class="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 disabled:opacity-50 flex items-center justify-center"
				title="Copy Selected"
				aria-label="Copy Selected"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
			</button>
			<button 
				onclick={pasteSquares}
				disabled={copiedSquares.length === 0}
				class="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 disabled:opacity-50 flex items-center justify-center"
				title="Paste Group"
				aria-label="Paste Group"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
			</button>
			<button 
				onclick={removeSelected}
				disabled={selectedIds.size === 0}
				class="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition-colors disabled:opacity-50 flex items-center justify-center"
				title="Delete Selected ({selectedIds.size})"
				aria-label="Delete Selected"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
			</button>
		</div>
	</div>

	<!-- Layout Workspace Canvas -->
	<div 
		bind:this={canvasElement}
		onwheel={handleWheel}
		oncontextmenu={handleContextMenu}
		class="w-full h-[480px] bg-slate-900 border border-slate-300 rounded-lg relative overflow-hidden select-none outline-none focus:ring-1 focus:ring-slate-300"
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmousedown={handleCanvasMouseDown}
		onkeydown={handleKeyDown}
		tabindex="0"
		role="presentation"
	>
		<!-- The Finite Active Canvas Area Layer Wrap -->
		<div 
			class="absolute bg-white shadow-xl pointer-events-none border border-slate-200"
			style="left: {panX}px; top: {panY}px; width: {gridWidth * GRID_SIZE * scale}px; height: {gridHeight * GRID_SIZE * scale}px;"
		>
			<div 
				class="w-full h-full opacity-5"
				style="background-image: linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px); background-size: {GRID_SIZE * scale}px {GRID_SIZE * scale}px;"
			></div>
		</div>

		<svg class="w-full h-full absolute inset-0 pointer-events-none">
			{#each squares as square (square.id)}
				{@const isOverlapping = overlappingIds().has(square.id)}
				{@const isSelected = selectedIds.has(square.id)}
				
				<rect 
					x={square.x * scale + panX} 
					y={square.y * scale + panY} 
					width={BOX_SIZE * scale} 
					height={BOX_SIZE * scale} 
					rx={6 * scale}
					class="cursor-move stroke-2 transition-colors duration-150 pointer-events-auto
						{isOverlapping 
							? (isSelected ? 'fill-red-400 stroke-red-700 ring-2 ring-red-400' : 'fill-red-100 stroke-red-500 shadow-sm') 
							: (isSelected ? 'fill-indigo-500 stroke-indigo-700 shadow-md ring-2 ring-indigo-400' : 'fill-slate-100 stroke-slate-400 hover:fill-slate-200')}"
					onmousedown={(e) => handleSquareMouseDown(square, e)}
				/>
			{/each}

			{#if isBoxSelecting && marqueeRect()}
				{@const mBox = marqueeRect()}
				<rect 
					x={mBox?.x} 
					y={mBox?.y} 
					width={mBox?.width} 
					height={mBox?.height} 
					class="fill-indigo-50/30 stroke-indigo-400 stroke-1" 
					style="stroke-dasharray: 4;"
				/>
			{/if}
		</svg>
	</div>
	<p class="text-[11px] text-slate-400 text-center italic">
		Tip: Scroll wheel zooms. Hold the <strong>Right Mouse Button</strong> to drag and look around the finite map layout workspace.
	</p>
</div>