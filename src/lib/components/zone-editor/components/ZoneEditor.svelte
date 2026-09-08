<script lang="ts">
	import { ZoneEditorState } from "../zoneState.svelte";
	import SubHeader from "./SubHeader.svelte";
	import Toolbar from "./Toolbar.svelte";
	import LeftSidebar from "./LeftSidebar.svelte";
	import RightSidebar from "./RightSidebar.svelte";
	import Canvas from "./Canvas.svelte";

	let {state, place, backLink} = $props();

	// Reactive side-effect triggered when grid dimensions change
	$effect(() => {
		state.moveSquareOnOutOfBound(state.gridWidth, state.gridHeight);
	});

</script>

<svelte:body onkeydown={state.handleKeyDown} onkeyup={state.handleKeyUp} onblur={state.handleWindowBlur} />

<div class="fixed inset-0 top-20 flex flex-col bg-[#e8ecef] select-none text-slate-800 font-sans overflow-hidden">
	<SubHeader {state} {backLink} {place}/>
	<Toolbar {state} />

	<div class="flex-1 flex overflow-hidden">
		<LeftSidebar />
		<Canvas {state} />
		<RightSidebar state={state}/>
	</div>
</div>