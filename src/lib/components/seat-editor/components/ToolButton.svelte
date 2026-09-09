<script lang="ts">
	import type { ToolConfig } from '$lib/components/seat-editor/config/tools';
	import type { ToolType } from '$lib/components/seat-editor/types';

	let { tool, activeTool, onSelect }: {
		tool: ToolConfig;
		activeTool: ToolType;
		onSelect: (id: ToolType) => void;
	} = $props();

	const isActive = $derived(activeTool === tool.id);
</script>

<button
	onclick={() => onSelect(tool.id)}
	class="w-8 h-8 border rounded flex items-center justify-center transition-colors relative
		{isActive 
			? 'bg-slate-300 border-slate-400 text-slate-900 shadow-inner' 
			: 'bg-[#e2e8f0] border-slate-300 text-slate-700 hover:bg-slate-300'}"
	title="{tool.label} {tool.shortcut ? `(${tool.shortcut})` : ''}"
>
	{#if tool.icon === 'pointer'}
		<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M3 3l7 18 3-7 7-3L3 3z"/>
		</svg>
	{:else if tool.icon === 'lasso'}
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 12 10" fill="none">
			<path d="M0.28418 9.49988C2.2759 8.12422 4.32184 8.31088 3.69856 5.92317M3.69856 5.92317C3.52766 5.26848 1.99106 4.27244 1.70666 3.17192C0.788211 -0.38207 5.12104 0.328767 7.96648 1.24595C9.3891 1.7045 12.0067 3.06182 11.0962 4.82266C10.1857 6.58349 5.84355 6.65686 3.69856 5.92317ZM3.69856 5.92317C3.69856 5.431 3.41403 4.82264 3.98309 5.09778C4.55215 5.37292 4.25771 6.28617 3.8008 6.47343C3.1295 6.74857 3.69856 6.47343 3.69856 5.92317Z" stroke="black"/>
		</svg>
	{:else if tool.icon === 'add-square'}
		<div class="w-3.5 h-3.5 bg-slate-800 rounded-xs"></div>
	{:else if tool.icon === 'add-line'}
		<div class="flex gap-0.5 items-center">
			<div class="w-1 h-3 bg-slate-800"></div>
			<div class="w-1 h-3 bg-slate-800"></div>
			<div class="w-1 h-3 bg-slate-800"></div>
		</div>
	{:else if tool.icon === 'add-array'}
		<div class="grid grid-cols-2 gap-0.5">
			<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
			<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
			<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
			<div class="w-1.5 h-1.5 bg-slate-800 rounded-xs"></div>
		</div>
	{:else if tool.icon === 'add-rect'}
		<div class="w-4 h-3 border-2 border-slate-800 rounded-xs"></div>
	{:else if tool.icon === 'add-circle'}
		<div class="w-4 h-4 border-2 border-slate-800 rounded-full"></div>
	{:else if tool.icon === 'add-polygon'}
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 17 14" fill="none">
		<path d="M12.2715 1.47852L15.9385 5.14551L14.0996 11.5801L6.11328 13.46L0.568359 9.30078L2.87402 0.539062L12.2715 1.47852Z" stroke="black" stroke-width="1.5"/>
		</svg>
	{/if}
	{#if tool.category === 'create'}
		<span class="absolute top-0 right-0.5 text-[8px] font-bold text-slate-600">+</span>
	{/if}
</button>