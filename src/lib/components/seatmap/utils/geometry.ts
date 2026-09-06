export interface Point {
	x: number;
	y: number;
}

export interface PolygonBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
	centerX: number;
	centerY: number;
}

/**
 * Axis-aligned bounding box of a flat [x0,y0,x1,y1,...] points array. Used to
 * size/center an `IconElement`'s glyph+label within its drawn boundary, and
 * generally useful for `PolygonShape` (e.g. computing a Transformer's
 * initial bounding box before the user starts dragging its anchors).
 */
export function polygonBounds(points: number[]): PolygonBounds {
	if (points.length < 2) {
		return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
	}

	let minX = points[0];
	let maxX = points[0];
	let minY = points[1];
	let maxY = points[1];

	for (let i = 0; i < points.length; i += 2) {
		const x = points[i];
		const y = points[i + 1];
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}

	return {
		minX,
		minY,
		maxX,
		maxY,
		width: maxX - minX,
		height: maxY - minY,
		centerX: (minX + maxX) / 2,
		centerY: (minY + maxY) / 2
	};
}

/**
 * Area-weighted centroid of a closed polygon (the standard "signed area"
 * formula) — this is where an `IconElement`'s glyph+label should be drawn,
 * since for concave/irregular boundaries it sits noticeably better than the
 * bounding-box center (e.g. an L-shaped restroom outline). Falls back to the
 * bounding-box center for degenerate input (fewer than 3 points, or a
 * zero-area/self-intersecting shape where the area-weighted formula divides
 * by ~0).
 */
export function polygonCentroid(points: number[]): Point {
	const vertexCount = points.length / 2;
	if (vertexCount < 3) {
		const b = polygonBounds(points);
		return { x: b.centerX, y: b.centerY };
	}

	let area = 0;
	let cx = 0;
	let cy = 0;

	for (let i = 0; i < vertexCount; i++) {
		const x0 = points[i * 2];
		const y0 = points[i * 2 + 1];
		const next = (i + 1) % vertexCount;
		const x1 = points[next * 2];
		const y1 = points[next * 2 + 1];

		const cross = x0 * y1 - x1 * y0;
		area += cross;
		cx += (x0 + x1) * cross;
		cy += (y0 + y1) * cross;
	}

	area *= 0.5;

	if (Math.abs(area) < 1e-6) {
		const b = polygonBounds(points);
		return { x: b.centerX, y: b.centerY };
	}

	return { x: cx / (6 * area), y: cy / (6 * area) };
}
