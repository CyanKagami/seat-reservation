<script lang="ts">
	interface Seat {
		seat_id: string;
		x: number;
		y: number;
	}

	interface SeatingMapData {
		location_id: string;
		dimension: {
			width: number;
			height: number;
		};
		seats: Seat[];
	}

	let { 
		mapData, 
		selectedSeatId = $bindable<string | null>(null),
		onSeatSelect = (seat: Seat) => {} 
	}: { 
		mapData: SeatingMapData; 
		selectedSeatId?: string | null;
		onSeatSelect?: (seat: Seat) => void;
	} = $props();

	const BOX_SIZE = 20; 
	const GRID_SIZE = 10;

	let gridPixelWidth = $derived(mapData.dimension.width * GRID_SIZE);
	let gridPixelHeight = $derived(mapData.dimension.height * GRID_SIZE);

	function handleSelect(seat: Seat) {
		selectedSeatId = seat.seat_id;
		onSeatSelect(seat);
	}
</script>

<div class="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center select-none">
	<!-- Minimal Grid Canvas Container -->
	<div 
		class="relative bg-white shadow-md border border-slate-300"
		style="width: {gridPixelWidth}px; height: {gridPixelHeight}px;"
	>
		<!-- Grid Pattern -->
		<div 
			class="w-full h-full opacity-10 pointer-events-none"
			style="background-image: linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px); background-size: {GRID_SIZE}px {GRID_SIZE}px;"
		></div>

		<!-- Interactive Seats Layer -->
		<svg class="absolute inset-0 w-full h-full">
			{#each mapData.seats as seat (seat.seat_id)}
				{@const isSelected = selectedSeatId === seat.seat_id}
				
				<rect 
					x={seat.x} 
					y={seat.y} 
					width={BOX_SIZE} 
					height={BOX_SIZE} 
					rx={4}
					class="cursor-pointer stroke-2 transition-all duration-150 
						{isSelected 
							? 'fill-indigo-600 stroke-indigo-300' 
							: 'fill-slate-100 stroke-slate-400 hover:fill-indigo-100 hover:stroke-indigo-400'}"
					onclick={() => handleSelect(seat)}
					onkeydown={(e) => e.key === 'Enter' && handleSelect(seat)}
					role="button"
					tabindex="0"
				/>
			{/each}
		</svg>
	</div>
</div>