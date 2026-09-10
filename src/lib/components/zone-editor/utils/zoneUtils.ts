export interface Point {
	x: number;
	y: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Merges adjacent seat rects into exact outer contour loops.
 */
export function getMergedSeatBoundary(seats: Rect[], padding: number = 2): Point[][] {
	if (seats.length === 0) return [];

	const edgeCounts = new Map<string, { p1: Point; p2: Point }>();
	const getKey = (p1: Point, p2: Point) =>
		`${Math.round(p1.x)},${Math.round(p1.y)}->${Math.round(p2.x)},${Math.round(p2.y)}`;

	for (const seat of seats) {
		const x1 = seat.x - padding;
		const y1 = seat.y - padding;
		const x2 = seat.x + seat.width + padding;
		const y2 = seat.y + seat.height + padding;

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

/**
 * Converts polygon loops into an SVG path string `d="M... L... Z"`
 */
export function loopsToSvgPath(loops: Point[][]): string {
	return loops
		.map((loop) =>
			loop.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
		)
		.join(' ');
}