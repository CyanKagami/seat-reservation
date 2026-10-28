<script lang="ts">
	import SubHeader from "./SubHeader.svelte";
	import Toolbar from "./Toolbar.svelte";
	import RightSidebar from "./RightSidebar.svelte";
	import Canvas from "./Canvas.svelte";
	import type { ZoneEditorState } from "../zoneState.svelte";
	import type { Place } from "$lib/type/place";
	import ReservationZonePicker from "./ReservationZonePicker.svelte";
  import LeftSidebar from "./LeftSidebar.svelte";
  import { alertModal } from "$lib/store/alert.svelte";

	let isCreateZonePopupOpen = $state(false)
	let isPreview = $state(false);
	let zoneName = $state('');
	let zoneColor = $state('#ffffff');
	let {zoneState, place, backLink} :  {zoneState:ZoneEditorState, place:Place, backLink:string} = $props();
	let selectedZoneId = $state("");

	function onZonePopupToggle(){
		isCreateZonePopupOpen = !isCreateZonePopupOpen;
	}

	function handleAddZone(){
		const result = zoneState.createZone({name: zoneName, color: zoneColor});
		if (!result) {
			alertModal.warning('ชื่อโซนซ้ำ', 'กรุณาเลือกชื่อโซนที่ไม่ซ้ำ')
		} else {
			const selectedSeatIds = new Set(
				zoneState.objects
					.filter((object) => object.type === 'seat' && zoneState.selectedIds.has(object.id))
					.map((seat) => seat.id)
			);
			zoneState.updateSelectedObjectZone(zoneName, selectedSeatIds);
		}
		zoneName = '';
		zoneColor = '#ffffff';
		isCreateZonePopupOpen = false;
	}
</script>

<svelte:window onkeydown={zoneState.handleKeyDown} />

<div class="fixed inset-0 top-20 flex flex-col bg-[#e8ecef] select-none text-slate-800 font-sans overflow-hidden">
	<SubHeader state={zoneState} {backLink} {place} bind:isPreview={isPreview}/>
	<Toolbar state={zoneState} />

	<div class="flex-1 flex overflow-hidden">
		<LeftSidebar zoneState={zoneState} onOpenPopup={onZonePopupToggle}/>
		
		{#if isPreview}
		<div class="w-full h-full flex-1 flex items-center justify-center">
			<ReservationZonePicker
					objects={zoneState.objects}
					zone={zoneState.zones}
					bind:selectedZoneId
					width={zoneState.gridWidth * 10 + 'px'}
					height={zoneState.gridHeight * 10 + 'px'}
				/>
		</div>
				
		{:else}

			<Canvas state={zoneState} />

		
		{/if}
		<RightSidebar zoneState={zoneState} onOpenPopup={onZonePopupToggle}/>
	</div>
</div>

<!--Create Zone Popup-->
{#if isCreateZonePopupOpen}
    <div class="w-full h-full bg-black/50 fixed top-0 left-0 z-50 flex items-center justify-center">
        <div class="bg-white w-120 rounded-lg flex flex-col items-center p-7 gap-4">
            <p class="text-2xl font-semibold">เพิ่มโซน</p>
            <div class="w-full">
				<label for="name" class="font-semibold block">
					ชื่อโซน
				</label>
                <input name="name" bind:value={zoneName} class="w-full rounded-lg" required>
            </div>
            <div class="w-full">
                <label for="create-zone-color" class=" font-semibold  block">
					สีประจำโซน
				</label>
				<div class="flex items-center gap-2">
					<input
						bind:value={zoneColor}
						type="color"
						id="create-zone-color"
						class="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
					/>
				</div>
            </div>
            <div class="w-full flex justify-between gap-3">
                <button class="w-1/2 border-2 border-black h-10 hover:bg-dim-gray hover:cursor-pointer rounded-lg" onclick={() => {isCreateZonePopupOpen = false}}>ยกเลิก</button>
                <button class="w-1/2 bg-accent h-10 hover:bg-accent-hover hover:cursor-pointer text-white rounded-lg" onclick={handleAddZone}>สร้าง</button>
            </div>
        </div>
    </div>
    {/if}