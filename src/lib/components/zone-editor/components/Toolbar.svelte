<script lang="ts">
	import type { ZoneEditorState } from "../zoneState.svelte";
	import { BOX_SIZE } from "../constants";
	import { TOOLS } from '$lib/components/zone-editor/config/tools';
	import ToolButton from './ToolButton.svelte';

	let { state }: { state: ZoneEditorState } = $props();

	const selectTools = $derived(TOOLS.filter(t => t.category === 'select'));
	const createTools = $derived(TOOLS.filter(t => t.category === 'create'));

</script>

<div class="bg-[#f0f0f0] px-6 py-1.5 border-b border-slate-300 flex items-center gap-3 text-xs">
	<!-- Grid Dimensions -->
	<div class="flex items-center gap-1.5 mr-2">
		<span class="text-slate-700 font-medium text-sm">ขนาด</span>
		<input 
			type="number" 
			value={state.gridWidth} 
			min={BOX_SIZE * 2}
			readonly
			max={3000}
			class="w-12 h-7 px-1 text-center bg-white border border-slate-400 rounded focus:outline-none font-medium text-sm"
		/>
		<span class="text-slate-500 font-bold text-sm">✕</span>
		<input 
			type="number" 
			value={state.gridHeight}
			readonly
			min={BOX_SIZE * 2}
			max={3000}
			class="w-12 h-7 px-1 text-center bg-white border border-slate-400 rounded focus:outline-none font-medium text-sm"
		/>
	</div>

	<div class="h-6 w-px bg-slate-300"></div>

	<!-- Tool Icons -->
	<div class="flex gap-1">
		{#each selectTools as tool (tool.id)}
			<ToolButton 
				{tool} 
				activeTool={state.activeTool} 
				onSelect={(id) => state.activeTool = id} 
			/>
		{/each}
	</div>

	<div class="w-px h-5 bg-slate-300"></div>

	<!-- Creation Tools -->
	<div class="flex gap-1">
		{#each createTools as tool (tool.id)}
			<ToolButton 
				{tool} 
				activeTool={state.activeTool} 
				onSelect={(id) => state.activeTool = id} 
			/>
		{/each}
	</div>

	<!-- Zoom Controls -->
	<div class="ml-auto flex items-center gap-1 text-xs">
		<button onclick={state.zoomOut} class="w-6 h-6 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">-</button>
		<span class="w-10 text-center font-mono text-[11px]">{Math.round(state.scale * 100)}%</span>
		<button onclick={state.zoomIn} class="w-6 h-6 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">+</button>
		<button onclick={state.resetZoom} class="px-1.5 h-6 bg-white border border-slate-300 rounded text-[10px] hover:bg-slate-100">Center</button>
	</div>
</div>