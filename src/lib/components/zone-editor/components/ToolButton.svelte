<script lang="ts">
	import type { ToolConfig } from '$lib/components/zone-editor/config/tools';
	import type { ToolType } from '$lib/components/zone-editor/types';

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
		<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M6 3c-2 0-3 2-3 4 0 5 8 9 8 14 0 0 3-1 3-3s-2-3-4-3-3 2-3 2"/>
		</svg>
	{:else if tool.icon === 'add-polygon'}
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 17 14" fill="none">
		<path d="M12.2715 1.47852L15.9385 5.14551L14.0996 11.5801L6.11328 13.46L0.568359 9.30078L2.87402 0.539062L12.2715 1.47852Z" stroke="black" stroke-width="1.5"/>
		</svg>
	{/if}
	{#if tool.category === 'create'}
		<span class="absolute top-0 right-0.5 text-[8px] font-bold text-slate-600">+</span>
	{/if}
</button>