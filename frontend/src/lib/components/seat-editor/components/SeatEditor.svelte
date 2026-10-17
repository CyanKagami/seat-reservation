<script lang="ts">
	import { SeatEditorState } from "../seatState.svelte";
	import SubHeader from "./SubHeader.svelte";
	import Toolbar from "./Toolbar.svelte";
	import LeftSidebar from "./LeftSidebar.svelte";
	import RightSidebar from "./RightSidebar.svelte";
	import Canvas from "./Canvas.svelte";

	let { seatState, place, backLink } = $props();
	let isCreateSeatType = $state(false);
	let isPreview = $state(false);
	let SeatTypeName = $state('');
	let SeatTypeDescription = $state('');
	let SeatTypeColor = $state('#ffffff');
	let seatTypeImage = $state<string | null>(null);

	$effect(() => {
		if (isCreateSeatType) {
			seatState.isUneditable = true; // Disable canvas interactions when the popup is open
		} else {
			seatState.isUneditable = false; // Enable canvas interactions when the popup is closed
		}
	});

	function onSeatTypePopupToggle() {
		isCreateSeatType = !isCreateSeatType;
	}

	function handleImageChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				seatTypeImage = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeImage() {
		seatTypeImage = null;
	}

	function resetForm() {
		SeatTypeName = '';
		SeatTypeDescription = '';
		SeatTypeColor = '#ffffff';
		seatTypeImage = null;
		isCreateSeatType = false;
	}

	function handleAddSeatType() {
		let result = seatState.createSeatType({
			name: SeatTypeName,
			color: SeatTypeColor,
			description: SeatTypeDescription,
			picture: seatTypeImage
		});

		if (!result) {
			alert('ชื่อประเภทเก้าอี้ซ้ำ');
			return;
		}

		resetForm();
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
		<RightSidebar state={seatState} onOpenPopup={onSeatTypePopupToggle} />
	</div>
</div>

<!--Create Zone Popup-->
{#if isCreateSeatType}
	<div class="w-full h-full bg-black/50 fixed top-0 left-0 z-50 flex items-center justify-center">
		<div class="bg-white w-120 rounded-lg flex flex-col items-center p-7 gap-4 max-h-[90vh] overflow-y-auto">
			<p class="text-2xl font-semibold">เพิ่มประเภทเก้าอี้</p>
			
			<div class="w-full">
				<label for="name" class="font-semibold block mb-1">
					ชื่อประเภทเก้าอี้
				</label>
				<input name="name" bind:value={SeatTypeName} class="w-full rounded-lg border border-slate-300 p-2" required>
			</div>

			<div class="w-full">
				<label for="description" class="font-semibold block mb-1">
					คำอธิบายประเภทเก้าอี้
				</label>
				<textarea name="description" bind:value={SeatTypeDescription} class="w-full rounded-lg border border-slate-300 p-2" required></textarea>
			</div>

			<!-- Image Upload & Preview Section -->
			<div class="w-full">
				<label class="font-semibold block mb-1">
					รูปภาพตัวอย่างที่นั่ง (ถ้ามี)
				</label>

				{#if seatTypeImage}
					<!-- Image Preview Container -->
					<div class="relative w-full h-40 bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
						<img src={seatTypeImage} alt="Seat Type Preview" class="w-full h-full object-contain" />
						<button 
							type="button" 
							onclick={removeImage}
							class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition cursor-pointer"
							title="ลบรูปภาพ"
						>
							<svg class="w-4 h-4 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
								<path d="M18 6L6 18M6 6l12 12"/>
							</svg>
						</button>
					</div>
				{:else}
					<!-- Upload File Input Dropzone -->
					<label class="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg cursor-pointer bg-slate-50 transition">
						<svg class="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
						<span class="text-xs text-slate-500 font-medium">อัปโหลดรูปภาพ (PNG, JPG, SVG)</span>
						<input type="file" accept="image/*" onchange={handleImageChange} class="hidden" />
					</label>
				{/if}
			</div>

			<div class="w-full">
				<label for="create-seat-type-color" class="font-semibold block mb-1">
					สีประจำประเภทเก้าอี้
				</label>
				<div class="flex items-center gap-2">
					<input
						bind:value={SeatTypeColor}
						type="color"
						id="create-seat-type-color"
						class="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
					/>
				</div>
			</div>

			<div class="w-full flex justify-between gap-3 mt-2">
				<button class="w-1/2 border-2 border-black h-10 hover:bg-dim-gray hover:cursor-pointer rounded-lg" onclick={resetForm}>ยกเลิก</button>
				<button class="w-1/2 bg-accent h-10 hover:bg-accent-hover hover:cursor-pointer text-white rounded-lg" onclick={handleAddSeatType}>สร้าง</button>
			</div>
		</div>
	</div>
{/if}