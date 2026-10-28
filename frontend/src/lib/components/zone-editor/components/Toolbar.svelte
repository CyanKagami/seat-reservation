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
	<div class="flex items-center gap-1.5 mr-2" aria-label="ขนาดผัง">
		<span class="text-slate-700 font-medium text-sm">ขนาด</span>
		<span class="min-w-12 px-1 text-center font-medium text-sm">{state.gridWidth}</span>
		<span class="text-slate-500 font-bold text-sm">✕</span>
		<span class="min-w-12 px-1 text-center font-medium text-sm">{state.gridHeight}</span>
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
		<button onclick={state.zoomOut} class="w-6 h-6 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100 cursor-pointer">-</button>
		<span class="w-10 text-center font-mono text-[11px]">{Math.round(state.scale * 100)}%</span>
		<button onclick={state.zoomIn} class="w-6 h-6 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100 cursor-pointer">+</button>
		<button onclick={state.resetZoom} class="px-1.5 h-6 bg-white border border-slate-300 rounded text-[10px] hover:bg-slate-100 cursor-pointer">Center</button>
	</div>
</div>