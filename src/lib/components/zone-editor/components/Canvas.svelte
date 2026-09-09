<script lang="ts">
	import { onMount } from "svelte";
	import type { ZoneEditorState } from "../zoneState.svelte";
	import { GRID_SIZE } from "../constants";
	let { state }: { state: ZoneEditorState } = $props();

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
	ondragover={state.handleDragOver}
	ondrop={state.handleDrop}
	onmousemove={state.handleMouseMove}
	onmouseup={state.handleMouseUp}
	onmousedown={state.handleCanvasMouseDown}
	class="relative flex-1 w-full h-full bg-[#e5e5e5] select-none outline-none overflow-hidden"

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
		<!-- Render Canvas Objects -->
		{#each state.objects as obj (obj.id)}
			{@const isSelected = state.selectedIds.has(obj.id)}
			{@const screenX = obj.x * state.scale + state.panX}
			{@const screenY = obj.y * state.scale + state.panY}
			{@const screenWidth = obj.width * state.scale}
			{@const screenHeight = obj.height * state.scale}
			{@const centerX = screenX + screenWidth / 2}
			{@const centerY = screenY + screenHeight / 2}

				{#if obj.type === 'seat'}
					{@const isOverlapping = state.overlappingIds.has(obj.id)}
					{@const status = obj.metadata?.status ?? 'available'}

					<!-- Determine fill/stroke based on status and selection -->
					{@const statusClasses = 
						status === 'unavailable'
							? (isSelected ? 'fill-stone-900 stroke-stone-900 ring-2 ring-indigo-400' : 'fill-stone-700 stroke-stone-600')
								: (isSelected ? 'fill-indigo-300 stroke-indigo-600 ring-2 ring-indigo-400' : 'fill-indigo-200 stroke-indigo-500 hover:fill-indigo-300')}

					<rect 
						x={screenX} 
						y={screenY} 
						width={screenWidth} 
						height={screenHeight} 
						role="button"
						onmousedown={(e) => state.handleSeatMouseDown(obj, e)}
						tabindex="0"
						rx={1 * state.scale}
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						class="cursor-move stroke-1 transition-colors pointer-events-auto focus:outline-none
							{isOverlapping 
								? (isSelected ? 'fill-red-400 stroke-red-700 ring-2 ring-red-500' : 'fill-red-200 stroke-red-500') 
								: statusClasses}"
						style={obj.metadata && obj.metadata.zone && state.zones[obj.metadata.zone] ? `fill: ${state.zones[obj.metadata.zone].color}; stroke:unset;` : ''}
					/>
				<!-- 1. env-rect -->
				{:else if obj.type === 'env-rect'}
					<rect 
						x={screenX} 
						y={screenY} 
						width={screenWidth} 
						height={screenHeight} 
						role="button"
						tabindex="0"
						rx={2 * state.scale}
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="cursor-move stroke-2 transition-colors pointer-events-auto focus:outline-none
							{isSelected ? 'stroke-indigo-600 ring-2 ring-indigo-400' : 'stroke-slate-500 hover:opacity-90'}"
					/>

				<!-- 2. env-circle -->
				{:else if obj.type === 'env-circle'}
					<ellipse 
						cx={centerX} 
						cy={centerY} 
						rx={screenWidth / 2} 
						ry={screenHeight / 2} 
						role="button"
						tabindex="0"
						transform="rotate({obj.rotation ?? 0}, {centerX}, {centerY})"
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="cursor-move stroke-2 transition-colors pointer-events-auto focus:outline-none
							{isSelected ? 'stroke-indigo-600 ring-2 ring-indigo-400' : 'stroke-slate-500 hover:opacity-90'}"
					/>

				<!-- 3. env-polygon -->
				{:else if obj.type === 'env-polygon' && obj.points}
					{@const svgPoints = obj.points.map(p => `${screenX + p.x * state.scale},${screenY + p.y * state.scale}`).join(' ')}
					<polygon 
						points={svgPoints} 
						role="button"
						tabindex="0"
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="cursor-move stroke-2 transition-colors pointer-events-auto focus:outline-none
							{isSelected ? 'stroke-indigo-600 ring-2 ring-indigo-400' : 'stroke-slate-500 hover:opacity-90'}"
					/>

				<!-- 4. env-icon-polygon -->
				{:else if obj.type === 'env-icon-polygon' && obj.points}
					{@const svgPoints = obj.points.map(p => `${screenX + p.x * state.scale},${screenY + p.y * state.scale}`).join(' ')}
					{@const centerRelX = obj.points.reduce((acc, p) => acc + p.x, 0) / obj.points.length}
					{@const centerRelY = obj.points.reduce((acc, p) => acc + p.y, 0) / obj.points.length}
					{@const centerScreenX = screenX + centerRelX * state.scale}
					{@const centerScreenY = screenY + centerRelY * state.scale}

					<g transform="rotate({obj.rotation ?? 0}, {centerScreenX}, {centerScreenY})">
						<polygon 
							points={svgPoints} 
							role="button"
							tabindex="0"
							style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
							class="cursor-move stroke-2 transition-colors pointer-events-auto focus:outline-none
								{isSelected ? 'stroke-indigo-600' : 'stroke-slate-500 hover:opacity-90'}"
						/>

					<!-- Centered Icon & Label Render -->
					<foreignObject 
						x={centerScreenX - 40 * state.scale} 
						y={centerScreenY - 30 * state.scale} 
						width={80 * state.scale} 
						height={60 * state.scale}
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
							<span class="text-xs font-semibold text-slate-800 whitespace-nowrap">{obj.label}</span>
						</div>
					</foreignObject>
				</g>
			{/if}
		{/each}

		<!-- Combined Selection Bounds Overlay & Rotation Handle -->
		{#if state.selectionBounds && state.selectedIds.size > 0}
			{@const selectedObjs = state.objects.filter((o) => state.selectedIds.has(o.id))}
			{@const isSingle = selectedObjs.length === 1}
			{@const singleObj = isSingle ? selectedObjs[0] : null}

			{#if isSingle && singleObj}
				{@const xs = singleObj.points ? singleObj.points.map(p => p.x) : [0, singleObj.width]}
				{@const ys = singleObj.points ? singleObj.points.map(p => p.y) : [0, singleObj.height]}
				{@const minPointX = Math.min(...xs)}
				{@const maxPointX = Math.max(...xs)}
				{@const minPointY = Math.min(...ys)}
				{@const maxPointY = Math.max(...ys)}

				{@const screenX = (singleObj.x + minPointX) * state.scale + state.panX}
				{@const screenY = (singleObj.y + minPointY) * state.scale + state.panY}
				{@const screenWidth = (maxPointX - minPointX) * state.scale}
				{@const screenHeight = (maxPointY - minPointY) * state.scale}
				
				{@const centerRelX = singleObj.points 
					? singleObj.points.reduce((a, p) => a + p.x, 0) / singleObj.points.length 
					: singleObj.width / 2}
				{@const centerRelY = singleObj.points 
					? singleObj.points.reduce((a, p) => a + p.y, 0) / singleObj.points.length 
					: singleObj.height / 2}
				{@const centerX = singleObj.x * state.scale + centerRelX * state.scale + state.panX}
				{@const centerY = singleObj.y * state.scale + centerRelY * state.scale + state.panY}
				{@const handleCenterX = screenX + screenWidth / 2}
				{@const handleCenterY = screenY - 24}

				<g transform="rotate({singleObj.rotation ?? 0}, {centerX}, {centerY})">
					<rect 
						x={screenX - 4} 
						y={screenY - 4} 
						width={screenWidth + 8} 
						height={screenHeight + 8} 
						class="fill-transparent stroke-indigo-500 stroke-1 pointer-events-auto cursor-move" 
						style="stroke-dasharray: 4;"
						onmousedown={state.handleSelectionBoundsMouseDown}
					/>

				</g>
			{:else}
				<!-- Multi-Object Selection: Axis-Aligned Bounding Box (AABB) -->
				{@const bounds = state.selectionBounds}
				{@const screenMinX = bounds.minX * state.scale + state.panX}
				{@const screenMinY = bounds.minY * state.scale + state.panY}
				{@const screenWidth = (bounds.maxX - bounds.minX) * state.scale}
				{@const screenHeight = (bounds.maxY - bounds.minY) * state.scale}
				{@const handleCenterX = screenMinX + screenWidth / 2}
				{@const handleCenterY = screenMinY - 24}

				<rect 
					x={screenMinX - 4} 
					y={screenMinY - 4} 
					width={screenWidth + 8} 
					height={screenHeight + 8} 
					class="fill-transparent stroke-indigo-500 stroke-1 pointer-events-auto cursor-move" 
					style="stroke-dasharray: 4;"
					onmousedown={state.handleSelectionBoundsMouseDown}
				/>


			{/if}
		{/if}

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
		
		<!-- Live Drag Preview for Polygon -->
		{#if state.isPolygonDrawing && state.previewPolygonSvgPoints}
			<polyline 
				points={state.previewPolygonSvgPoints} 
				class="fill-none stroke-indigo-600 stroke-2 pointer-events-none"
				style="stroke-dasharray: 4;"
			/>

			<!-- Render Placed Vertex Indicators -->
			{#each state.polygonPoints as pt, idx}
				{@const cx = pt.x * state.scale + state.panX}
				{@const cy = pt.y * state.scale + state.panY}
				<circle 
					cx={cx} 
					cy={cy} 
					r={idx === 0 ? 6 : 4} 
					class="{idx === 0 ? 'fill-indigo-600 stroke-white stroke-2' : 'fill-indigo-400'} pointer-events-none"
				/>
			{/each}
		{/if}
	</svg>
</div>
