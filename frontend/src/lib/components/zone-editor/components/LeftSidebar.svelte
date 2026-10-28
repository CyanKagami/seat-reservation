<script lang="ts">
  	import type { ZoneEditorState } from "../zoneState.svelte";
	import { alertModal } from "$lib/store/alert.svelte";

	let { zoneState, onOpenPopup }: { zoneState: ZoneEditorState, onOpenPopup: () => void } = $props();
	function handleRemoveZone(event: MouseEvent, zoneName: string) {
		event.stopPropagation();
		alertModal.warning(
			"ยืนยันการลบโซน",
			`ต้องการลบโซน "${zoneName}" หรือไม่? ที่นั่งในโซนนี้จะยังอยู่ แต่จะไม่ถูกกำหนดให้อยู่ในโซนใด`,
			{
				confirmText: "ลบโซน",
				cancelText: "ยกเลิก",
				showCancel: true,
				onconfirm: () => {
					zoneState.objects = zoneState.objects.map((obj) => {
						if (obj.metadata?.zone === zoneName) {
							const metadata = { ...obj.metadata };
							delete metadata.zone;
							return { ...obj, metadata };
						}
						return obj;
					});
					delete zoneState.zones[zoneName];
				}
			}
		);
	}
	function handleApplyZone(zoneName: string) {
		if (zoneState.selectedIds.size === 0) return;
		zoneState.updateSelectedObjectZone(zoneName);
	}

	function handleAutoLabel(event: MouseEvent, zoneName: string) {
		event.stopPropagation();
		const manualSeatsCount = zoneState.objects.filter(
			(object) => object.type === "seat" &&
				object.metadata?.zone === zoneName &&
				object.metadata?.isManualLabel
		).length;

		alertModal.warning(
			"ยืนยันการจัดป้ายกำกับอัตโนมัติ",
			manualSeatsCount > 0
				? `ระบบจะจัดป้ายกำกับในโซน "${zoneName}" ใหม่ โดยมีที่นั่งที่กำหนดป้ายเอง ${manualSeatsCount} ที่นั่ง`
				: `ระบบจะจัดป้ายกำกับที่นั่งในโซน "${zoneName}" ใหม่โดยอัตโนมัติ`,
			{
				confirmText: "ดำเนินการต่อ",
				cancelText: "ยกเลิก",
				showCancel: true,
				onconfirm: () => {
					if (manualSeatsCount > 0) {
						alertModal.warning(
							"มีป้ายกำกับที่กำหนดเอง",
							`โซน "${zoneName}" มีที่นั่งที่ล็อกป้ายเองอยู่ ${manualSeatsCount} ที่นั่ง ต้องการเขียนทับหรือไม่?`,
							{
								confirmText: "เขียนทับทั้งหมด",
								cancelText: "ข้ามที่นั่งที่กำหนดเอง",
								showCancel: true,
								onconfirm: () => zoneState.autoLabelZone(zoneName, true),
								oncancel: () => zoneState.autoLabelZone(zoneName, false)
							}
						);
					} else {
						zoneState.autoLabelZone(zoneName, false);
					}
				}
			}
		);
	}
</script>

<aside class="w-48 bg-[#f5f5f5] border-r border-slate-300 p-4 flex flex-col gap-3 shrink-0 select-none">
	<h2 class="text-xs font-bold text-slate-800">โซนที่นั่ง</h2>
		<button class="flex items-center rounded-md bg-accent hover:bg-accent-hover p-1 gap-2 text-white cursor-pointer" onclick={onOpenPopup}>
			<svg class="h-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>
			<span class='text-xs'>เพิ่มโซน</span>
		</button>
	
	<hr class="border-dim-gray mb-2">

	<div class="flex flex-col gap-1">
		<!-- Information Center -->
		{#each Object.entries(zoneState.zones) as [zoneName, zoneInfo]}
			{@const seatCount = zoneState.objects.filter((o) => o.type === 'seat' && o.metadata?.zone === zoneName).length}
			<div 
				role="button"
				tabindex="0"
				onclick={() => handleApplyZone(zoneName)}
				onkeydown={(e) => e.key === 'Enter' && handleApplyZone(zoneName)}
				class="w-full flex items-center justify-between border group border-slate-300 rounded bg-white gap-1 hover:bg-indigo-50 hover:border-indigo-400 transition-colors p-2 cursor-pointer"
				title="คลิกเพื่อกำหนดโซนของที่นั่งที่เลือกให้เป็น {zoneName}"
			>
				<div class="flex items-center gap-1.5 min-w-0">
					<div class="w-2.5 h-2.5 rounded-xs shrink-0" style={`background-color: ${zoneInfo.color};`}></div>
					<div class="flex flex-col min-w-0">
						<span class="text-[10px] text-slate-800 font-semibold truncate leading-tight">{zoneName}</span>
						<span class="text-[8px] text-slate-400">{seatCount} ที่นั่ง</span>
					</div>
				</div>

				<div class="flex items-center gap-1">
					<button
						type="button"
						title="จัดป้ายกำกับที่นั่งในโซนนี้อัตโนมัติ"
						class="text-[9px] px-1.5 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer font-medium whitespace-nowrap"
						onclick={(e) => handleAutoLabel(e, zoneName)}
					>
						Auto Label
					</button>
					<button
						type="button"
						title={`ลบโซน ${zoneName}`}
						aria-label={`ลบโซน ${zoneName}`}
						class="w-5 h-5 flex shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500 cursor-pointer"
						onclick={(e) => handleRemoveZone(e, zoneName)}
					>
						<svg class="fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
							<path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/>
						</svg>
					</button>
				</div>
			</div>
		{/each}
	</div>
</aside>