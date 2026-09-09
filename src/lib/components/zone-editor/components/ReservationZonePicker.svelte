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
		zone: { [key: string]: Zone };
		selectedZoneId?: string;
		padding?: number;
		onZoneSelect?: (zoneId: string, seats: CanvasObject[]) => void;
	} = $props();

	// --- 1. Contour Union Helper (Exact 2D Rect Boundary Merging) ---
	function getMergedSeatBoundary(seats: CanvasObject[], seatPadding: number = 3): Point[][] {
		if (seats.length === 0) return [];

		const edgeCounts = new Map<string, { p1: Point; p2: Point }>();
		const getKey = (p1: Point, p2: Point) =>
			`${Math.round(p1.x)},${Math.round(p1.y)}->${Math.round(p2.x)},${Math.round(p2.y)}`;

		for (const seat of seats) {
			const x1 = seat.x - seatPadding;
			const y1 = seat.y - seatPadding;
			const x2 = seat.x + seat.width + seatPadding;
			const y2 = seat.y + seat.height + seatPadding;

			const corners = [
				{ x: x1, y: y1 },
				{ x: x2, y: y1 },
				{ x: x2, y: y2 },
				{ x: x1, y: y2 }
			];

			const edges = [
				{ p1: corners[0], p2: corners[1] },
				{ p1: corners[1], p2: corners[2] },
				{ p1: corners[2], p2: corners[3] },
				{ p1: corners[3], p2: corners[0] }
			];

			for (const edge of edges) {
				const forwardKey = getKey(edge.p1, edge.p2);
				const reverseKey = getKey(edge.p2, edge.p1);

				if (edgeCounts.has(reverseKey)) {
					edgeCounts.delete(reverseKey);
				} else {
					edgeCounts.set(forwardKey, edge);
				}
			}
		}

		const remainingEdges = Array.from(edgeCounts.values());
		const polygons: Point[][] = [];

		while (remainingEdges.length > 0) {
			const currentPolygon: Point[] = [];
			let currentEdge = remainingEdges.pop()!;
			currentPolygon.push(currentEdge.p1);

			let searching = true;
			while (searching) {
				currentPolygon.push(currentEdge.p2);
				const nextIdx = remainingEdges.findIndex(
					(e) => Math.hypot(e.p1.x - currentEdge.p2.x, e.p1.y - currentEdge.p2.y) < 2
				);

				if (nextIdx !== -1) {
					currentEdge = remainingEdges.splice(nextIdx, 1)[0];
				} else {
					searching = false;
				}
			}
			polygons.push(currentPolygon);
		}

		return polygons;
	}

	function loopsToSvgPath(loops: Point[][]): string {
		return loops
			.map(
				(loop) =>
					loop.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
			)
			.join(" ");
	}

	// --- 2. Largest Space / Pole of Inaccessibility Algorithm ---
	function isPointInPolygon(px: number, py: number, poly: Point[]): boolean {
		let inside = false;
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const xi = poly[i].x, yi = poly[i].y;
			const xj = poly[j].x, yj = poly[j].y;
			const intersect =
				yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}
		return inside;
	}

	function pointToSegmentDistance(
		px: number,
		py: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	): number {
		const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
		if (l2 === 0) return Math.hypot(px - x1, py - y1);
		let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
		t = Math.max(0, Math.min(1, t));
		return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
	}

	function getVisualCenterInLargestArea(
		loops: Point[][],
		overlappingPolygons: Point[][] = []
	): Point {
		if (!loops.length || !loops[0].length) return { x: 0, y: 0 };
		const outer = loops[0];

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		outer.forEach((p) => {
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		});

		let bestPoint = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
		let maxDist = -Infinity;

		const steps = 18;
		const stepX = (maxX - minX) / steps || 1;
		const stepY = (maxY - minY) / steps || 1;

		for (let x = minX; x <= maxX; x += stepX) {
			for (let y = minY; y <= maxY; y += stepY) {
				if (!isPointInPolygon(x, y, outer)) continue;

				const isCoveredByOtherZone = overlappingPolygons.some((poly) =>
					isPointInPolygon(x, y, poly)
				);
				if (isCoveredByOtherZone) continue;

				let minDist = Infinity;
				for (const loop of loops) {
					for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
						const d = pointToSegmentDistance(
							x,
							y,
							loop[i].x,
							loop[i].y,
							loop[j].x,
							loop[j].y
						);
						minDist = Math.min(minDist, d);
					}
				}

				if (minDist > maxDist) {
					maxDist = minDist;
					bestPoint = { x, y };
				}
			}
		}

		return bestPoint;
	}

	// --- 3. Environment Shapes (Background / Decor Context) ---
	let envObjects = $derived(
		objects.filter((o) => o.type.startsWith("env-") && o.type !== "env-polygon")
	);

	// --- 4. Group Seats into Active Zones & Standalone Unavailable Zone ---
	let zones = $derived.by(() => {
		const groups: Record<
			string,
			{
				id: string;
				name: string;
				color: string;
				isUnavailableZone?: boolean;
				seats: CanvasObject[];
			}
		> = {};

		objects.forEach((obj) => {
			if (obj.type === "seat") {
				const isAvailable = (obj.metadata?.status ?? "available") === "available";

				if (!isAvailable) {
					// 1. All unavailable seats form their own global zone
					const uId = "zone-unavailable";
					if (!groups[uId]) {
						groups[uId] = {
							id: uId,
							name: "ไม่ว่าง / Unavailable",
							color: "#090d16",
							isUnavailableZone: true,
							seats: []
						};
					}
					groups[uId].seats.push(obj);
				} else if (obj.metadata?.zone) {
					// 2. Available seats stay in their respective zones
					const zId = obj.metadata.zone;
					if (!groups[zId]) {
						groups[zId] = {
							id: zId,
							name: obj.metadata?.zone ?? "โซนทั่วไป",
							color: zone[zId]?.color ?? "#6366f1",
							isUnavailableZone: false,
							seats: []
						};
					}
					groups[zId].seats.push(obj);
				}
			}
		});

		const rawZones = Object.values(groups).map((g) => {
			const loops = getMergedSeatBoundary(g.seats, 3);
			const pathData = loopsToSvgPath(loops);
			const allPoints = loops.flat();

			return {
				id: g.id,
				name: g.name,
				color: g.color,
				isUnavailableZone: g.isUnavailableZone ?? false,
				seats: g.seats,
				availableCount: g.isUnavailableZone ? 0 : g.seats.length,
				totalCount: g.seats.length,
				loops,
				pathData,
				allPoints
			};
		});

		rawZones.sort((a, b) => b.totalCount - a.totalCount);

		return rawZones.map((zoneItem, idx) => {
			const smallerChildLoops = rawZones
				.slice(idx + 1)
				.flatMap((z) => z.loops);

			const { x: centerX, y: centerY } = getVisualCenterInLargestArea(
				zoneItem.loops,
				smallerChildLoops
			);

			return {
				...zoneItem,
				centerX,
				centerY
			};
		});
	});

	// --- 5. Dynamic Responsive ViewBox Calculation ---
	let viewBox = $derived.by(() => {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		const allVisualPoints: Point[] = [];
		envObjects.forEach((e) => {
			allVisualPoints.push({ x: e.x, y: e.y }, { x: e.x + e.width, y: e.y + e.height });
		});
		zones.forEach((z) => {
			allVisualPoints.push(...z.allPoints);
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

<div class="relative w-full h-full min-h-[400px] bg-white rounded-xl overflow-hidden shadow-lg p-2 select-none flex flex-col">
	<svg viewBox={viewBox} class="w-full h-full flex-1">
		<!-- LAYER 1: Environment Objects (Matched Canvas Style) -->
		<g class="environment-layer">
			{#each envObjects as obj (obj.id)}
				{@const cx = obj.x + obj.width / 2}
				{@const cy = obj.y + obj.height / 2}

				{#if obj.type === 'env-circle'}
					<ellipse
						cx={cx}
						cy={cy}
						rx={obj.width / 2}
						ry={obj.height / 2}
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="stroke-slate-600 stroke-[1.5px]"
					/>
				{:else}
					<!-- Rect and Icon-Polygon Shapes -->
					<rect
						x={obj.x}
						y={obj.y}
						width={obj.width}
						height={obj.height}
						rx={2}
						style="fill: {obj.metadata?.color ?? '#e2e8f0'};"
						class="stroke-slate-600 stroke-[1.5px]"
					/>
				{/if}

				<!-- Canvas-Style Target/Stage Icon and Centered Label -->
				<foreignObject
					x={obj.x}
					y={obj.y}
					width={obj.width}
					height={obj.height}
					class="pointer-events-none"
				>
					<div class="w-full h-full flex flex-col items-center justify-center p-1 text-slate-800">
							{#if obj.iconType === 'toilet'}
								<svg class="w-5 h-5 stroke-slate-800 fill-none" viewBox="0 0 24 24" stroke-width="1.8">
									<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-3-3"/><circle cx="19" cy="8" r="2"/>
								</svg>
							{:else if obj.iconType === 'entrance'}
								<svg class="w-5 h-5 fill-slate-800" viewBox="0 0 24 24">
									<path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-8h-2V9h2v2z"/>
								</svg>
							{:else if obj.iconType === 'stage'}
								<svg class="w-5 h-5 stroke-slate-800 fill-none" viewBox="0 0 24 24" stroke-width="1.8">
									<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
								</svg>
							{/if}

						{#if obj.label}
							<span class="text-[11px] font-semibold text-slate-800 leading-tight">
								{obj.label}
							</span>
						{/if}
					</div>
				</foreignObject>
			{/each}
		</g>

		<!-- LAYER 2: Interactive Zones (Includes Standalone Unavailable Zone) -->
		<g class="zones-layer">
			{#each zones as zone (zone.id)}
				{@const isSelected = selectedZoneId === zone.id}
				{@const isUnavailable = zone.isUnavailableZone}

				<path
					d={zone.pathData}
					style="fill: {isUnavailable ? '#090d16' : zone.color}; stroke: {isUnavailable ? '#1e293b' : isSelected ? '#ffffff' : zone.color};"
					class="transition-all duration-200 
						{isUnavailable ? 'cursor-not-allowed fill-opacity-90 stroke-1' : 'cursor-pointer'}
						{!isUnavailable && isSelected 
							? 'fill-opacity-50 stroke-[3px] filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
							: !isUnavailable ? 'fill-opacity-25 stroke-[1.5px] hover:fill-opacity-40 hover:stroke-white' : ''}"
					onclick={() => !isUnavailable && handleZoneClick(zone.id, zone.seats)}
					role="button"
					tabindex="0"
				/>
			{/each}
		</g>

		<!-- LAYER 3: Zone Badges (Rendered in Largest Open Space per Zone) -->
		<g class="zone-labels-layer pointer-events-none">
			{#each zones as zone (zone.id)}
				{@const isSelected = selectedZoneId === zone.id}
				{@const isUnavailable = zone.isUnavailableZone}

				<foreignObject
					x={zone.centerX - 65}
					y={zone.centerY - 22}
					width={130}
					height={44}
					class="overflow-visible"
				>
					<div class="w-full h-full flex flex-col items-center justify-center">
						<div
							class="px-2.5 py-1 rounded-md text-center shadow-md border transition-transform
								{isUnavailable 
									? 'bg-slate-950/90 text-slate-400 border-slate-800' 
									: isSelected 
										? 'bg-white text-slate-900 border-white ring-2 ring-indigo-500 scale-105' 
										: 'bg-slate-900/90 text-white border-slate-700'}"
						>
							<div class="text-[11px] font-bold leading-tight whitespace-nowrap">
								{zone.name}
							</div>
							
							<div class="text-[9px] mt-0.5 font-medium flex items-center justify-center gap-1">
								{#if isUnavailable}
									<span class="text-rose-400/80">{zone.totalCount} ที่นั่ง</span>
								{:else}
									<span class={isSelected ? 'text-indigo-600' : 'text-emerald-400'}>
										ว่าง {zone.availableCount}/{zone.totalCount} ที่
									</span>
								{/if}
							</div>
						</div>
					</div>
				</foreignObject>
			{/each}
		</g>
	</svg>
</div>