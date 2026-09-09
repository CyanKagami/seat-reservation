export interface Point {
	x: number;
	y: number;
}

function dist(p1: Point, p2: Point): number {
	return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function ccw(p1: Point, p2: Point, p3: Point): boolean {
	return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
}

function intersects(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
	if (
		(p1.x === p3.x && p1.y === p3.y) || (p1.x === p4.x && p1.y === p4.y) ||
		(p2.x === p3.x && p2.y === p3.y) || (p2.x === p4.x && p2.y === p4.y)
	) {
		return false;
	}
	return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

function causesIntersection(p1: Point, p2: Point, hull: Point[]): boolean {
	for (let i = 0; i < hull.length - 1; i++) {
		if (intersects(p1, p2, hull[i], hull[i + 1])) return true;
	}
	return false;
}

/**
 * Robust Concave Hull with maximum edge length threshold.
 * @param points Array of 2D points (seat corners)
 * @param maxEdgeLength Maximum allowed gap between boundary points (e.g. seatWidth * 2)
 * @param k Number of nearest neighbors to search (default: 5)
 */
export function getConcaveHull(points: Point[], maxEdgeLength: number = 60, k: number = 5): Point[] {
	if (points.length <= 3) return points;

	// Deduplicate points
	const unique: Point[] = [];
	const seen = new Set<string>();
	for (const p of points) {
		const key = `${Math.round(p.x)},${Math.round(p.y)}`;
		if (!seen.has(key)) {
			seen.add(key);
			unique.push(p);
		}
	}

	if (unique.length <= 3) return unique;

	// Find starting point (lowest Y)
	let start = unique[0];
	for (let i = 1; i < unique.length; i++) {
		if (unique[i].y < start.y || (unique[i].y === start.y && unique[i].x < start.x)) {
			start = unique[i];
		}
	}

	const hull: Point[] = [start];
	let current = start;
	let prevAngle = 0;

	for (let step = 0; step < 300; step++) {
		// Filter candidates: must be within maxEdgeLength
		const candidates = unique
			.filter((p) => p !== current && dist(current, p) <= maxEdgeLength)
			.map((p) => {
				let angle = Math.atan2(p.y - current.y, p.x - current.x) - prevAngle;
				while (angle < 0) angle += 2 * Math.PI;
				while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
				return { point: p, angle };
			})
			.sort((a, b) => b.angle - a.angle) // Largest outer angle first
			.slice(0, k);

		let selected: Point | null = null;

		for (const candidate of candidates) {
			const p = candidate.point;

			// Check if we can close the polygon loop
			if (p === start && hull.length > 2) {
				if (!causesIntersection(current, start, hull)) {
					selected = start;
					break;
				}
			}

			// Check if candidate point is valid and doesn't self-intersect
			if (p !== start && !causesIntersection(current, p, hull)) {
				selected = p;
				break;
			}
		}

		if (selected === start) {
			return hull; // Polygon closed cleanly with concave turns
		}

		if (selected) {
			hull.push(selected);
			prevAngle = Math.atan2(selected.y - current.y, selected.x - current.x);
			current = selected;
		} else {
			// If blocked, fallback to relaxing maxEdgeLength slightly
			maxEdgeLength *= 1.25;
		}
	}

	return hull;
}