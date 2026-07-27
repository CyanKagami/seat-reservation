<script lang="ts">
  import { onMount, untrack } from "svelte";

	interface Square {
		id: string;
		x: number;
		y: number;
	}

	const BOX_SIZE = 20; 
	const GRID_SIZE = 10;

	// Location ID configuration
	let locationId = $state("v_123");

	// Finite grid parameters
	let gridWidth = $state(80);
	let gridHeight = $state(60);

	// Zoom state management runes
	let scale = $state(1.0);
	const MIN_SCALE = 0.5;
	const MAX_SCALE = 3.0;

	// Panning state (in plain view space pixels to match render space)
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });

	let squares = $state<Square[]>([
		{ id: "s_1", x: 40, y: 40 },
		{ id: "s_2", x: 160, y: 40 }
	]);
	
	// svelte-ignore state_referenced_locally
	let selectedIds = $state<Set<string>>(new Set([squares[0].id]));
	let copiedSquares = $state<Square[]>([]);

	// Dragging mechanics
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let initialPositions = new Map<string, { x: number; y: number }>();

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
		
		const handleResize = () => centerGrid();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	});

	function centerGrid() {
		if (!canvasElement) return;
		panX = (canvasElement.clientWidth - gridWidth * GRID_SIZE * scale) / 2;
		panY = (canvasElement.clientHeight - gridHeight * GRID_SIZE * scale) / 2;
	}

	// Export Seating Layout as JSON file
	function exportAsJSON() {
		if (overlappingIds.size) return;
		const exportData = {
			location_id: locationId,
			dimension: {
				width: gridWidth,
				height: gridHeight
			},
			seats: squares.map((s, idx) => ({
				seat_id: s.id.startsWith("s_") ? s.id : `s_${idx + 1}`,
				x: s.x,
				y: s.y
			}))
		};

		const jsonString = JSON.stringify(exportData, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `seating_layout_${locationId}.json`;
		anchor.click();
		
		URL.revokeObjectURL(url);
	}

	// Derived marquee rectangle boundary coordinates in view space
	let marqueeRect = $derived.by(() => {
		if (!isBoxSelecting) return null;
		const x = Math.min(boxStart.x, boxEnd.x);
		const y = Math.min(boxStart.y, boxEnd.y);
		const width = Math.abs(boxStart.x - boxEnd.x);
		const height = Math.abs(boxStart.y - boxEnd.y);
		return { x, y, width, height };
	});

	let overlappingIds = $derived.by(() => {
		const cellOf = (v: number) => Math.floor(v / GRID_SIZE);
		const buckets = new Map<string, Square[]>();
		for (const s of squares) {
			const key = `${cellOf(s.x)},${cellOf(s.y)}`;
			(buckets.get(key) ?? buckets.set(key, []).get(key)!).push(s);
		}
		const overlaps = new Set<string>();
		for (const s of squares) {
			const cx = cellOf(s.x), cy = cellOf(s.y);
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					for (const other of buckets.get(`${cx+dx},${cy+dy}`) ?? []) {
						if (other.id !== s.id &&
							Math.abs(s.x - other.x) <= GRID_SIZE &&
							Math.abs(s.y - other.y) <= GRID_SIZE) {
							overlaps.add(s.id);
							overlaps.add(other.id);
						}
					}
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
			id: `s_${squares.length + 1}`,
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
		console.log("Copy")
		if (selectedIds.size === 0) return;
		copiedSquares = squares
			.filter(s => selectedIds.has(s.id))
			.map(s => ({ ...s }));
	}

	function pasteSquares() {
		if (copiedSquares.length === 0) return;
		
		const nextBatch: Square[] = [];
		const nextSelected = new Set<string>();

		copiedSquares.forEach((src, idx) => {
			const newId = `s_${squares.length + idx + 1}`;
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

	let rafPending = false;

	function handleMouseMove(event: MouseEvent) {
		if (rafPending) return;
		rafPending = true;
		let {clientX, clientY} = event;
		requestAnimationFrame(() => {
			rafPending = false;
			if (isPanning) {
				panX = clientX - panStart.x;
				panY = clientY - panStart.y;
			} else if (isDragging) {
				const dx = (clientX - dragStart.x) / scale;
				const dy = (clientY - dragStart.y) / scale;

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
					x: clientX - rect.left, 
					y: clientY - rect.top 
				};

				const box = marqueeRect;
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
		});
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
		console.log(event.ctrlKey)
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
<svelte:body onkeydown={handleKeyDown} />
<div class="fixed inset-0 w-screen h-screen flex flex-col bg-slate-900 select-none overflow-hidden">
	<!-- Header / Toolbar Actions -->
	<header class="flex flex-wrap justify-between items-center bg-slate-800 px-4 py-2.5 border-b border-slate-700 z-10 gap-2">
		<div class="flex items-center gap-3">
			<button 
				onclick={addSquare} 
				class="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-sm"
				title="Add New Square"
				aria-label="Add Square"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
				Square
			</button>

			<!-- Editable Finite Grid Dimension Workspace Controls -->
			<div class="flex items-center gap-1 text-slate-300 bg-slate-900/80 border border-slate-700 rounded px-2.5 py-1 text-xs">
				<span class="font-medium text-[11px] uppercase tracking-wider text-slate-400 mr-1">Grid:</span>
				<input 
					type="number" 
					bind:value={gridWidth} 
					step={1}
					min={BOX_SIZE * 2}
					max={3000}
					class="w-12 text-center bg-transparent border-none outline-none focus:ring-0 font-mono p-0 text-white"
					title="Grid Width (px)"
				/>
				<span class="text-slate-500 mx-0.5">×</span>
				<input 
					type="number" 
					bind:value={gridHeight} 
					step={1}
					min={BOX_SIZE * 2}
					max={3000}
					class="w-12 text-center bg-transparent border-none outline-none focus:ring-0 font-mono p-0 text-white"
					title="Grid Height (px)"
				/>
				<span class="text-slate-400 font-mono text-[10px] ml-0.5">px</span>
			</div>
		</div>

		<!-- Zoom Control Interface Sub-Group -->
		<div class="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 mx-auto">
			<button onclick={zoomOut} class="px-2 py-1 text-xs font-bold hover:bg-slate-800 rounded text-slate-300 transition-colors" title="Zoom Out">-</button>
			<button onclick={resetZoom} class="px-2 py-1 text-xs font-mono font-medium hover:bg-slate-800 rounded text-slate-200 min-w-12.5 text-center transition-colors" title="Reset Camera View">
				{Math.round(scale * 100)}%
			</button>
			<button onclick={zoomIn} class="px-2 py-1 text-xs font-bold hover:bg-slate-800 rounded text-slate-300 transition-colors" title="Zoom In">+</button>
		</div>
		
		<div class="flex items-center gap-2">
			<button 
				onclick={copySelected}
				disabled={selectedIds.size === 0}
				class="p-1.5 bg-slate-700 border border-slate-600 rounded hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-700 flex items-center justify-center transition-colors"
				title="Copy Selected"
				aria-label="Copy Selected"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
			</button>
			<button 
				onclick={pasteSquares}
				disabled={copiedSquares.length === 0}
				class="p-1.5 bg-slate-700 border border-slate-600 rounded hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-700 flex items-center justify-center transition-colors"
				title="Paste Group"
				aria-label="Paste Group"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1-2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
			</button>
			<button 
				onclick={removeSelected}
				disabled={selectedIds.size === 0}
				class="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 rounded transition-colors disabled:opacity-40 flex items-center justify-center mr-2"
				title="Delete Selected ({selectedIds.size})"
				aria-label="Delete Selected"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
			</button>

			<!-- Export JSON Button (Top Right) -->
			<button 
				onclick={exportAsJSON}
				class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-sm"
				title="Export Seating Layout as JSON"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
				Export JSON
			</button>
		</div>
	</header>
	
	<!-- Fullscreen Workspace Canvas -->
	<div
		bind:this={canvasElement}
		onwheel={handleWheel}
		oncontextmenu={handleContextMenu}
		class="relative flex-1 w-full h-full bg-slate-900 select-none outline-none"
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmousedown={handleCanvasMouseDown}
		role="presentation"
	>
		<!-- Finite Grid Area Layer Wrap -->
		<div 
			class="absolute bg-white shadow-2xl pointer-events-none border border-slate-200"
			style="left: {panX}px; top: {panY}px; width: {gridWidth * GRID_SIZE * scale}px; height: {gridHeight * GRID_SIZE * scale}px;"
		>
			<div 
				class="w-full h-full opacity-5"
				style="background-image: linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px); background-size: {GRID_SIZE * scale}px {GRID_SIZE * scale}px;"
			></div>
		</div>

		<svg class="w-full h-full absolute inset-0 pointer-events-none">
			{#each squares as square (square.id)}
				{@const isOverlapping = overlappingIds.has(square.id)}
				{@const isSelected = selectedIds.has(square.id)}
				
				<rect 
					x={square.x * scale + panX} 
					y={square.y * scale + panY} 
					width={BOX_SIZE * scale} 
					height={BOX_SIZE * scale} 
					role="button"
					tabindex="0"
					rx={6 * scale}
					class="cursor-move stroke-2 transition-colors duration-150 pointer-events-auto
						{isOverlapping 
							? (isSelected ? 'fill-red-400 stroke-red-700 ring-2 ring-red-400' : 'fill-red-100 stroke-red-500 shadow-sm') 
							: (isSelected ? 'fill-indigo-500 stroke-indigo-700 shadow-md ring-2 ring-indigo-400' : 'fill-slate-100 stroke-slate-400 hover:fill-slate-200')}"
					onmousedown={(e) => handleSquareMouseDown(square, e)}
				/>
			{/each}

			{#if isBoxSelecting && marqueeRect}
				{@const mBox = marqueeRect}
				<rect 
					x={mBox?.x} 
					y={mBox?.y} 
					width={mBox?.width} 
					height={mBox?.height} 
					class="fill-indigo-500/20 stroke-indigo-400 stroke-1" 
					style="stroke-dasharray: 4;"
				/>
			{/if}
		</svg>

		<!-- Floating Tip Toast -->
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs pointer-events-none shadow-lg">
			Scroll wheel zooms. Hold <strong>Right Mouse Button</strong> to pan canvas.
		</div>
	</div>
</div>