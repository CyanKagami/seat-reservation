<script lang="ts">
	function handleDragStart(event: DragEvent, iconType: string, label: string) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('iconType', iconType);
		event.dataTransfer.setData('label', label);
		event.dataTransfer.effectAllowed = 'copy';
	}
</script>

<aside class="w-48 bg-[#f5f5f5] border-r border-slate-300 p-4 flex flex-col gap-3 shrink-0 select-none">
	<h2 class="text-xs font-bold text-slate-800">องค์ประกอบ</h2>
	<div class="flex gap-2">
		<!-- Information Center -->
		<div 
			draggable="true"
			ondragstart={(e) => handleDragStart(e, 'info', 'ศูนย์ประชาสัมพันธ์')}
			class="w-18 h-16 border border-dashed border-slate-400 rounded bg-white flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors p-1"
		>
			<svg class="w-5 h-5 fill-indigo-600" viewBox="0 0 24 24">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
			</svg>
			<span class="text-[9px] text-slate-700 font-medium text-center leading-tight">ประชาสัมพันธ์</span>
		</div>
	</div>
</aside>