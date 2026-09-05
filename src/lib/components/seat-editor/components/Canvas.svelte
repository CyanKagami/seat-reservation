<script lang="ts">
	import { onMount } from "svelte";
	import type { SeatEditorState } from "../seatState.svelte";
	import { BOX_SIZE, GRID_SIZE } from "../constants";

	let { state }: { state: SeatEditorState } = $props();

	onMount(() => {
		if (state.canvasElement) {
			state.centerGrid();
		}
		const handleResize = () => state.centerGrid();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	});
</script>

<div
	bind:this={state.canvasElement}
	onwheel={state.handleWheel}
	oncontextmenu={state.handleContextMenu}
	class="relative flex-1 w-full h-full bg-[#e5e5e5] select-none outline-none overflow-hidden {state.activeTool === 'add-square' ? 'cursor-crosshair' : ''}"
	onmousemove={state.handleMouseMove}
	onmouseup={state.handleMouseUp}
	onmousedown={state.handleCanvasMouseDown}
	role="presentation"
>
	<!-- Finite Grid Container -->
	<div 
		class="absolute bg-white shadow-md pointer-events-none border border-slate-300"
		style="left: {state.panX}px; top: {state.panY}px; width: {state.gridWidth * GRID_SIZE * state.scale}px; height: {state.gridHeight * GRID_SIZE * state.scale}px;"
	>
		<div 
			class="w-full h-full opacity-[0.03]"
			style="background-image: linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px); background-size: {GRID_SIZE * state.scale}px {GRID_SIZE * state.scale}px;"
		></div>
	</div>

	<!-- SVG Interactive Render Area -->
	<svg class="w-full h-full absolute inset-0 pointer-events-none">
		<!-- Render Committed Environment Objects (Stages/Walls) -->
		{#each state.envObjects as env (env.id)}
			{@const screenX = env.x * state.scale + state.panX}
			{@const screenY = env.y * state.scale + state.panY}
			{@const screenWidth = env.width * state.scale}
			{@const screenHeight = env.height * state.scale}

			<rect 
				x={screenX} 
				y={screenY} 
				width={screenWidth} 
				height={screenHeight} 
				rx={2 * state.scale}
				class="fill-slate-200/80 stroke-slate-500 stroke-2 pointer-events-auto"
			/>
		{/each}
		<!-- Render Seats -->
		{#each state.squares as square (square.id)}
			{@const isOverlapping = state.overlappingIds.has(square.id)}
			{@const isSelected = state.selectedIds.has(square.id)}
			{@const screenX = square.x * state.scale + state.panX}
			{@const screenY = square.y * state.scale + state.panY}
			{@const screenBoxSize = BOX_SIZE * state.scale}
			{@const centerX = screenX + screenBoxSize / 2}
			{@const centerY = screenY + screenBoxSize / 2}
			
			<rect 
				x={screenX} 
				y={screenY} 
				width={screenBoxSize} 
				height={screenBoxSize} 
				role="button"
				tabindex="0"
				rx={1 * state.scale}
				transform="rotate({square.rotation ?? 0}, {centerX}, {centerY})"
				class="cursor-move stroke-1 transition-colors duration-100 pointer-events-auto
					{isOverlapping 
						? (isSelected ? 'fill-red-400 stroke-red-700 ring-2 ring-red-500' : 'fill-red-200 stroke-red-500') 
						: (isSelected ? 'fill-indigo-300 stroke-indigo-600 ring-2 ring-indigo-400' : 'fill-[#d1d5db] stroke-[#6b7280] hover:fill-[#e5e7eb]')}"
				onmousedown={(e) => state.handleSquareMouseDown(square, e)}
			/>
		{/each}

		<!-- Marquee Box Selection Preview -->
		{#if state.isBoxSelecting && state.marqueeRect}
			{@const mBox = state.marqueeRect}
			<rect 
				x={mBox.x} 
				y={mBox.y} 
				width={mBox.width} 
				height={mBox.height} 
				class="fill-blue-500/10 stroke-blue-500 stroke-1" 
				style="stroke-dasharray: 3;"
			/>
		{/if}

		<!-- Freeform Lasso Selection Preview -->
		{#if state.isLassoSelecting && state.lassoSvgPoints}
			<polygon 
				points={state.lassoSvgPoints} 
				class="fill-indigo-500/15 stroke-indigo-600 stroke-1" 
				style="stroke-dasharray: 4;"
			/>
		{/if}
        <!-- Live Line Seat Preview Layer -->
        {#if state.isLineDrawing}
            {#each state.previewLineSeats as pt}
                <rect 
                    x={pt.x * state.scale + state.panX} 
                    y={pt.y * state.scale + state.panY} 
                    width={BOX_SIZE * state.scale} 
                    height={BOX_SIZE * state.scale} 
                    rx={1 * state.scale}
                    class="fill-indigo-400/50 stroke-indigo-600 stroke-1 pointer-events-none"
                    style="stroke-dasharray: 2;"
                />
            {/each}
        {/if}

		{#if state.isArrayDrawing}
			{#each state.previewArraySeats as pt}
				<rect 
					x={pt.x * state.scale + state.panX} 
					y={pt.y * state.scale + state.panY} 
					width={BOX_SIZE * state.scale} 
					height={BOX_SIZE * state.scale} 
					rx={1 * state.scale}
					class="fill-emerald-400/50 stroke-emerald-600 stroke-1 pointer-events-none"
					style="stroke-dasharray: 2;"
				/>
			{/each}
		{/if}
		<!-- Live Drag Preview for Environment Rectangle -->
		{#if state.isRectDrawing && state.previewRect}
			{@const p = state.previewRect}
			<rect 
				x={p.x * state.scale + state.panX} 
				y={p.y * state.scale + state.panY} 
				width={p.width * state.scale} 
				height={p.height * state.scale} 
				rx={2 * state.scale}
				class="fill-slate-300/40 stroke-slate-600 stroke-2 pointer-events-none"
				style="stroke-dasharray: 4;"
			/>
		{/if}
		<!-- Rotation Handle & Selection Bounding Overlay -->
	{#if state.selectionBounds && state.selectedIds.size > 0}
		{@const bounds = state.selectionBounds}
		{@const screenMinX = bounds.minX * state.scale + state.panX}
		{@const screenMinY = bounds.minY * state.scale + state.panY}
		{@const screenWidth = (bounds.maxX - bounds.minX) * state.scale}
		{@const screenHeight = (bounds.maxY - bounds.minY) * state.scale}
		{@const handleCenterX = screenMinX + screenWidth / 2}
		{@const handleCenterY = screenMinY - 24}

		<!-- Outer Selection Bounding Box -->
		<rect 
			x={screenMinX - 4} 
			y={screenMinY - 4} 
			width={screenWidth + 8} 
			height={screenHeight + 8} 
			class="fill-none stroke-indigo-500 stroke-1 pointer-events-none" 
			style="stroke-dasharray: 4;"
		/>

		<!-- Line connecting bounding box to rotation handle -->
		<line 
			x1={handleCenterX} 
			y1={screenMinY - 4} 
			x2={handleCenterX} 
			y2={handleCenterY} 
			class="stroke-indigo-500 stroke-1 pointer-events-none"
		/>

			<!-- Rotation Handle Circle -->
			<circle 
				cx={handleCenterX} 
				cy={handleCenterY} 
				r={6} 
				class="fill-white stroke-indigo-600 stroke-2 cursor-grab active:cursor-grabbing transition-transform pointer-events-auto"
				onmousedown={state.handleRotateStart}
			/>
	{/if}
	</svg>
</div>