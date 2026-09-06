<script lang="ts">
	import { SeatEditorState } from "../seatState.svelte";
	import SubHeader from "./SubHeader.svelte";
	import Toolbar from "./Toolbar.svelte";
	import LeftSidebar from "./LeftSidebar.svelte";
	import RightSidebar from "./RightSidebar.svelte";
	import Canvas from "./Canvas.svelte";

	let {placeId} = $props();
	const state = new SeatEditorState(placeId);
	// Reactive side-effect triggered when grid dimensions change
	$effect(() => {
		state.moveSquareOnOutOfBound(state.gridWidth, state.gridHeight);
	});

	// $effect(() => {
	// 	console.log(state.isShiftPressed)
	// })
</script>

<svelte:body onkeydown={state.handleKeyDown} onkeyup={state.handleKeyUp} onblur={state.handleWindowBlur} />

<div class="fixed inset-0 top-20 flex flex-col bg-[#e8ecef] select-none text-slate-800 font-sans overflow-hidden">
	<SubHeader {state} />
	<Toolbar {state} />

	<div class="flex-1 flex overflow-hidden">
		<LeftSidebar />
		<Canvas {state} />
		<RightSidebar state={state}/>
	</div>
</div>