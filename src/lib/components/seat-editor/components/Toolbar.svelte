<script lang="ts">
	import type { SeatEditorState } from "../seatState.svelte";
	import { BOX_SIZE } from "../constants";

	let { state }: { state: SeatEditorState } = $props();
</script>

<div class="bg-[#f0f0f0] px-6 py-1.5 border-b border-slate-300 flex items-center gap-3 text-xs">
	<!-- Grid Dimensions -->
	<div class="flex items-center gap-1.5 mr-2">
		<span class="text-slate-700 font-medium text-sm">ขนาด</span>
		<input 
			type="number" 
			bind:value={state.gridWidth} 
			min={BOX_SIZE * 2}
			max={3000}
			class="w-12 h-7 px-1 text-center bg-white border border-slate-400 rounded focus:outline-none font-medium text-sm"
		/>
		<span class="text-slate-500 font-bold text-sm">✕</span>
		<input 
			type="number" 
			bind:value={state.gridHeight} 
			min={BOX_SIZE * 2}
			max={3000}
			class="w-12 h-7 px-1 text-center bg-white border border-slate-400 rounded focus:outline-none font-medium text-sm"
		/>
	</div>

	<div class="h-6 w-px bg-slate-300"></div>

	<!-- Tool Icons -->
	<div class="flex items-center gap-1">
		<button onclick={() => state.activeTool = 'box-select'}
        class="w-7 h-7 border border-slate-300 rounded flex items-center justify-center {state.activeTool === 'box-select' ? 'bg-slate-300 border-slate-400' : 'bg-[#e2e8f0]'}" title="Pointer">
			<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 19V2z"/></svg>
		</button>
		 <button 
            onclick={() => state.activeTool = 'lasso'}
            class="w-7 h-7 border border-slate-300 rounded flex items-center justify-center {state.activeTool === 'lasso' ? 'bg-slate-300 border-slate-400' : 'bg-[#e2e8f0]'}" 
            title="Freeform Select"
            >
            <svg class="w-4 h-4 stroke-current fill-none" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M12 4C8 4 4 6 4 10c0 5 4 10 9 10 3.5 0 7-2 7-5 0-3.5-3-5.5-6-5.5-2.5 0-4.5 1.5-4.5 3.5 0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2" stroke-dasharray="2 2"/>
            </svg>
            </button>

		<div class="h-5 w-px bg-slate-300 mx-0.5"></div>

		<!-- Functional Add Seat -->
		<button 
            onclick={() => state.activeTool = 'add-square'}
			class="w-7 h-7 border border-slate-300 rounded flex items-center justify-center {state.activeTool === 'add-square' ? 'bg-slate-300 border-slate-400' : 'bg-[#e2e8f0]'}"  
			title="Add Seat Square"
		>
			<div class="w-3.5 h-3.5 bg-slate-800 rounded-xs"></div>
			<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>

		<!-- Static Placeholder Tools -->
		<button 
        onclick={() => state.activeTool = 'add-line'}
        class="w-7 h-7 border border-slate-300 rounded flex items-center justify-center {state.activeTool === 'add-line' ? 'bg-slate-300 border-slate-400' : 'bg-[#e2e8f0]'}" >
			<div class="flex gap-0.5">
				<div class="w-1 h-3 bg-slate-700"></div>
				<div class="w-1 h-3 bg-slate-700"></div>
				<div class="w-1 h-3 bg-slate-700"></div>
			</div>
			<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>
		<button 
			onclick={() => state.activeTool = 'add-array'}
			class="w-7 h-7 border border-slate-300 rounded flex items-center justify-center transition-colors relative {state.activeTool === 'add-array' ? 'bg-slate-300 border-slate-400 text-slate-900' : 'bg-[#e2e8f0] border-slate-300 text-slate-700 hover:bg-slate-300'}" 
			title="Add 2D Array Tool Mode"
		>
			<div class="grid grid-cols-2 gap-0.5">
				<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
				<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
				<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
				<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
			</div>
			<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>

		<div class="h-5 w-px bg-slate-300 mx-0.5"></div>

		<button 
			onclick={() => state.activeTool = 'add-rect'}
			class="w-7 h-7 border border-slate-300 rounded flex items-center justify-center transition-colors relative {state.activeTool === 'add-rect' ? 'bg-slate-300 border-slate-400 text-slate-900' : 'bg-[#e2e8f0] border-slate-300 text-slate-700 hover:bg-slate-300'}" 
			title="Add Rectangle Outline Tool"
		>
			<div class="w-3.5 h-3.5 border-2 border-slate-800 rounded-xs"></div>
			<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>
		<button class="w-7 h-7 bg-[#e2e8f0] border border-slate-300 rounded flex items-center justify-center text-slate-700 hover:bg-slate-300 relative" title="Circle Shape">
			<div class="w-3.5 h-3.5 border border-slate-700 rounded-full"></div>
			<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>
		<button class="w-7 h-7 bg-[#e2e8f0] border border-slate-300 rounded flex items-center justify-center text-slate-700 hover:bg-slate-300 relative" title="Polygon Shape">
			<svg class="w-3.5 h-3.5 stroke-slate-700 fill-none" viewBox="0 0 24 24"><polygon points="12 2 22 8.5 18 21 6 21 2 8.5"/></svg>
			<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>
		<button class="w-7 h-7 bg-[#e2e8f0] border border-slate-300 rounded flex items-center justify-center text-slate-800 font-bold text-xs hover:bg-slate-300 relative" title="Add Text">
			T<span class="absolute top-0 right-0.5 text-[9px] font-bold">+</span>
		</button>
	</div>

	<!-- Action Shortcuts -->
	<div class="flex items-center gap-1 ml-2">
		<button 
			onclick={state.copySelected}
			disabled={state.selectedIds.size === 0}
			class="px-2 h-7 bg-[#e2e8f0] border border-slate-300 rounded hover:bg-slate-300 disabled:opacity-40 text-[11px] font-semibold"
		>
			Copy
		</button>
		<button 
			onclick={state.pasteSquares}
			disabled={state.copiedSquares.length === 0}
			class="px-2 h-7 bg-[#e2e8f0] border border-slate-300 rounded hover:bg-slate-300 disabled:opacity-40 text-[11px] font-semibold"
		>
			Paste
		</button>
		<button 
            id="delete-button"
			onclick={state.removeSelected}
			disabled={state.selectedIds.size === 0}
			class="px-2 h-7 bg-red-100 border border-red-300 text-red-700 rounded hover:bg-red-200 disabled:opacity-40 text-[11px] font-semibold"
		>
			Delete
		</button>
	</div>

	<!-- Zoom Controls -->
	<div class="ml-auto flex items-center gap-1 text-xs">
		<button onclick={state.zoomOut} class="w-6 h-6 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">-</button>
		<span class="w-10 text-center font-mono text-[11px]">{Math.round(state.scale * 100)}%</span>
		<button onclick={state.zoomIn} class="w-6 h-6 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">+</button>
		<button onclick={state.resetZoom} class="px-1.5 h-6 bg-white border border-slate-300 rounded text-[10px] hover:bg-slate-100">Center</button>
	</div>
</div>