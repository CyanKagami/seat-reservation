<script lang="ts">
	import { SeatEditorState } from "../seatState.svelte";
	import SubHeader from "./SubHeader.svelte";
	import Toolbar from "./Toolbar.svelte";
	import LeftSidebar from "./LeftSidebar.svelte";
	import RightSidebar from "./RightSidebar.svelte";
	import Canvas from "./Canvas.svelte";

	let {seatState , place, backLink} = $props();
	let isCreateCharacteristic = $state(false)
	let isPreview = $state(false);
	let characteristicName = $state('');
	let characteristicColor = $state('#ffffff');
	function onSeatCharacteristicPopupToggle(){
		isCreateCharacteristic = !isCreateCharacteristic;
	}

	function handleAddCharacteristic(){
		let result = seatState.createZone({name: characteristicName, color: characteristicColor});
		if (!result) {
			alert('ชื่อโซนซ้ำ')
		}
		characteristicName = '';
		characteristicColor = '#ffffff';
		isCreateCharacteristic = false;
	}

	
	// Reactive side-effect triggered when grid dimensions change
	$effect(() => {
		seatState.moveSquareOnOutOfBound(seatState.gridWidth, seatState.gridHeight);
	});

</script>

<svelte:body onkeydown={seatState.handleKeyDown} onkeyup={seatState.handleKeyUp} onblur={seatState.handleWindowBlur} />

<div class="fixed inset-0 top-20 flex flex-col bg-[#e8ecef] select-none text-slate-800 font-sans overflow-hidden">
	<SubHeader state={seatState} {backLink} {place} />
	<Toolbar state={seatState} />

	<div class="flex-1 flex overflow-hidden">
		<LeftSidebar />
		<Canvas state={seatState} />
		<RightSidebar state={seatState} onOpenPopup={onSeatCharacteristicPopupToggle} />
	</div>
</div>

<!--Create Zone Popup-->
{#if isCreateCharacteristic}
    <div class="w-full h-full bg-black/50 fixed top-0 left-0 z-50 flex items-center justify-center">
        <div class="bg-white w-120 rounded-lg flex flex-col items-center p-7 gap-4">
            <p class="text-2xl font-semibold">เพิ่มลักษณะที่นั่ง</p>
            <div class="w-full">
				<label for="name" class="font-semibold block">
					ชื่อลักษณะ
				</label>
                <input name="name" bind:value={characteristicName} class="w-full rounded-lg" required>
            </div>
            <div class="w-full">
                <label for="create-characteristic-color" class=" font-semibold  block">
					สีประจำโซน
				</label>
				<div class="flex items-center gap-2">
					<input
						bind:value={characteristicColor}
						type="color"
						id="create-characteristic-color"
						class="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
					/>
				</div>
            </div>
            <div class="w-full flex justify-between gap-3">
                <button class="w-1/2 border-2 border-black h-10 hover:bg-dim-gray hover:cursor-pointer rounded-lg" onclick={() => {isCreateCharacteristic = false}}>ยกเลิก</button>
                <button class="w-1/2 bg-accent h-10 hover:bg-accent-hover hover:cursor-pointer text-white rounded-lg" onclick={handleAddCharacteristic}>สร้าง</button>
            </div>
        </div>
    </div>
    {/if}