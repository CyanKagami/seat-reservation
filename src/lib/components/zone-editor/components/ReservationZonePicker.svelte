<script lang="ts">
	import type { CanvasObject, Zone } from "../types";

	interface Point {
		x: number;
		y: number;
	}

	let {
		objects = [],
        zone = {},
		selectedZoneId = $bindable(""),
		padding = 40,
		onZoneSelect
	}: {
		objects: CanvasObject[];
        zone:{[key: string]: Zone};
		selectedZoneId?: string;
		padding?: number;
		onZoneSelect?: (zoneId: string, seats: CanvasObject[]) => void;
	} = $props();

	// --- 1. Convex Hull Helper (Computes outer zone boundary from seats) ---
	function getConvexHull(points: Point[]): Point[] {
		if (points.length <= 2) return points;
		const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

		const lower: Point[] = [];
		for (const p of sorted) {
			while (
				lower.length >= 2 &&
				(lower[lower.length - 1].x - lower[lower.length - 2].x) * (p.y - lower[lower.length - 2].y) -
					(lower[lower.length - 1].y - lower[lower.length - 2].y) * (p.x - lower[lower.length - 2].x) <= 0
			) {
				lower.pop();
			}
			lower.push(p);
		}

		const upper: Point[] = [];
		for (let i = sorted.length - 1; i >= 0; i--) {
			const p = sorted[i];
			while (
				upper.length >= 2 &&
				(upper[upper.length - 1].x - upper[upper.length - 2].x) * (p.y - upper[upper.length - 2].y) -
					(upper[upper.length - 1].y - upper[upper.length - 2].y) * (p.x - upper[upper.length - 2].x) <= 0
			) {
				upper.pop();
			}
			upper.push(p);
		}

		upper.pop();
		lower.pop();
		return lower.concat(upper);
	}

	// --- 2. Environment Shapes (Background / Decor Context) ---
	let envObjects = $derived(
		objects.filter((o) => o.type.startsWith("env-") && o.type !== "env-polygon")
	);

	// --- 3. Group Seats into Clickable Zone Regions ---
	let zones = $derived.by(() => {
		const groups: Record<
			string,
			{
				id: string;
				name: string;
				color: string;
				seats: CanvasObject[];
				points: Point[];
			}
		> = {};

		// Aggregate seats by zoneId
		objects.forEach((obj) => {
			if (obj.type === "seat" && obj.metadata?.zone) {
				const zId = obj.metadata.zone;
				if (!groups[zId]) {
					groups[zId] = {
						id: zId,
						name: obj.metadata?.zone ?? "โซนทั่วไป",
						color: zone[obj.metadata?.zone].color ?? "#6366f1",
						seats: [],
						points: []
					};
				}

				groups[zId].seats.push(obj);

				// Add seat outer corners with padding offset
				const seatPad = 6;
				groups[zId].points.push(
					{ x: obj.x - seatPad, y: obj.y - seatPad },
					{ x: obj.x + obj.width + seatPad, y: obj.y - seatPad },
					{ x: obj.x + obj.width + seatPad, y: obj.y + obj.height + seatPad },
					{ x: obj.x - seatPad, y: obj.y + obj.height + seatPad }
				);
			}
		});

		// Compute Hull polygon and metrics for each zone
		return Object.values(groups).map((g) => {
			const hull = getConvexHull(g.points);
			const availableSeats = g.seats.filter(
				(s) => (s.metadata?.status ?? "available") === "available"
			);

			// Center point for rendering badge labels
			const centerX = hull.reduce((a, p) => a + p.x, 0) / hull.length;
			const centerY = hull.reduce((a, p) => a + p.y, 0) / hull.length;

			return {
				id: g.id,
				name: g.name,
				color: g.color,
				seats: g.seats,
				availableCount: availableSeats.length,
				totalCount: g.seats.length,
				hullPoints: hull,
				centerX,
				centerY
			};
		});
	});

	// --- 4. Dynamic Responsive ViewBox Calculation ---
	let viewBox = $derived.by(() => {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

		const allVisualPoints: Point[] = [];
		envObjects.forEach((e) => {
			allVisualPoints.push({ x: e.x, y: e.y }, { x: e.x + e.width, y: e.y + e.height });
		});
		zones.forEach((z) => {
			allVisualPoints.push(...z.hullPoints);
		});

		if (allVisualPoints.length === 0) return "0 0 800 600";

		allVisualPoints.forEach((p) => {
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		});

		const width = Math.max(maxX - minX + padding * 2, 300);
		const height = Math.max(maxY - minY + padding * 2, 200);
		return `${minX - padding} ${minY - padding} ${width} ${height}`;
	});

	function handleZoneClick(zoneId: string, seats: CanvasObject[]) {
		selectedZoneId = zoneId;
		onZoneSelect?.(zoneId, seats);
	}
</script>

<div class="relative w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden shadow-lg p-2 select-none flex flex-col">
	<svg viewBox={viewBox} class="w-full h-full flex-1">
		<!-- LAYER 1: Environment Objects (Decor & Landmarks) -->
		<g class="environment-layer opacity-80">
			{#each envObjects as obj (obj.id)}
				{@const cx = obj.x + obj.width / 2}
				{@const cy = obj.y + obj.height / 2}

				{#if obj.type === 'env-rect'}
					<rect
						x={obj.x}
						y={obj.y}
						width={obj.width}
						height={obj.height}
						rx={4}
						style="fill: {obj.metadata?.color ?? '#334155'};"
						class="stroke-slate-600 stroke-1"
					/>
				{:else if obj.type === 'env-circle'}
					<ellipse
						cx={cx}
						cy={cy}
						rx={obj.width / 2}
						ry={obj.height / 2}
						style="fill: {obj.metadata?.color ?? '#334155'};"
						class="stroke-slate-600 stroke-1"
					/>
				{:else if obj.type === 'env-icon-polygon'}
					<rect
						x={obj.x}
						y={obj.y}
						width={obj.width}
						height={obj.height}
						rx={6}
						class="fill-slate-800 stroke-slate-600 stroke-1"
					/>
				{/if}

				<!-- Environment Icon / Labels -->
				{#if obj.label || obj.iconType}
					<foreignObject x={cx - 50} y={cy - 15} width={100} height={30} class="pointer-events-none">
						<div class="w-full h-full flex items-center justify-center gap-1 text-slate-300 text-[10px] font-medium">
							{#if obj.iconType === 'stage'}
								<span class="text-amber-400 font-bold uppercase tracking-wider">🎭 เวที</span>
							{:else if obj.iconType === 'entrance'}
								<span class="text-emerald-400 font-bold">🚪 ทางเข้า</span>
							{:else if obj.iconType === 'toilet'}
								<span class="text-sky-400">🚻 ห้องน้ำ</span>
							{:else}
								<span>{obj.label}</span>
							{/if}
						</div>
					</foreignObject>
				{/if}
			{/each}
		</g>

		<!-- LAYER 2: Interactive Grouped Zone Regions -->
		<g class="zones-layer">
			{#each zones as zone (zone.id)}
				{@const isSelected = selectedZoneId === zone.id}
				{@const svgPoints = zone.hullPoints.map((p) => `${p.x},${p.y}`).join(" ")}
				{@const isSoldOut = zone.availableCount === 0}

				<g
					class="group transition-all duration-200 {isSoldOut ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}"
					onclick={() => !isSoldOut && handleZoneClick(zone.id, zone.seats)}
					role="button"
					tabindex="0"
				>
					<!-- Clickable Dynamic Zone Boundary -->
					<polygon
						points={svgPoints}
						style="fill: {zone.color};"
						class="transition-all duration-200 stroke-2 
							{isSelected 
								? 'fill-opacity-50 stroke-white stroke-[3px] filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
								: 'fill-opacity-25 stroke-slate-300/60 group-hover:fill-opacity-40 group-hover:stroke-white'}"
					/>

					<!-- Center Zone Info Badge -->
					<foreignObject
						x={zone.centerX - 65}
						y={zone.centerY - 22}
						width={130}
						height={44}
						class="pointer-events-none overflow-visible"
					>
						<div class="w-full h-full flex flex-col items-center justify-center">
							<div
								class="px-2.5 py-1 rounded-md text-center shadow-md border transition-transform group-hover:scale-105
									{isSelected 
										? 'bg-white text-slate-900 border-white ring-2 ring-indigo-500' 
										: 'bg-slate-900/90 text-white border-slate-700'}"
							>
								<div class="text-[11px] font-bold leading-tight whitespace-nowrap">
									{zone.name}
								</div>
								
								<div class="text-[9px] mt-0.5 font-medium flex items-center justify-center gap-1">
									{#if isSoldOut}
										<span class="text-rose-400">เต็มแล้ว</span>
									{:else}
										<span class={isSelected ? 'text-indigo-600' : 'text-emerald-400'}>
											ว่าง {zone.availableCount}/{zone.totalCount} ที่
										</span>
									{/if}
								</div>
							</div>
						</div>
					</foreignObject>
				</g>
			{/each}
		</g>
	</svg>
</div>