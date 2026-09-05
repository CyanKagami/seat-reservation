<script lang="ts">
	import type { SeatEditorState } from "../seatState.svelte";

	let { state }: { state: SeatEditorState } = $props();
</script>

<div class="bg-[#f0f0f0] px-6 py-2.5 border-b border-slate-300 flex items-center justify-between">
	<h1 class="text-base font-bold text-slate-900">แผนผังของ l-1</h1>
	<button 
        id="save-button"
		onclick={state.exportAsJSON}
		disabled={state.overlappingIds.size > 0}
		class="px-6 py-1.5 bg-[#1c6b80] hover:bg-[#165566] text-white font-medium text-sm rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
	>
		บันทึก
	</button>
</div>