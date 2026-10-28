import type { Point } from './types';

export function rotatePoint(
	px: number,
	py: number,
	cx: number,
	cy: number,
	angleDegrees: number
): Point {
	const rad = (angleDegrees * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const dx = px - cx;
	const dy = py - cy;

	return {
		x: cx + (dx * cos - dy * sin),
		y: cy + (dx * sin + dy * cos)
	};
}

export function isDarkColor(hex: string): boolean {
	if (!hex) return false;
	hex = hex.replace(/^#/, '');
	if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
	const r = parseInt(hex.substring(0, 2), 16) || 0;
	const g = parseInt(hex.substring(2, 4), 16) || 0;
	const b = parseInt(hex.substring(4, 6), 16) || 0;
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq < 128;
}

export function darkenHexColor(hex: string, percent: number): string {
	hex = hex.replace(/^#/, '');
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	r = Math.max(0, Math.floor(r * (1 - percent)));
	g = Math.max(0, Math.floor(g * (1 - percent)));
	b = Math.max(0, Math.floor(b * (1 - percent)));

	const toHex = (val: number) => val.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function screenToCanvas(screenPt: Point, panX: number, panY: number, scale: number): Point {
	return {
		x: (screenPt.x - panX) / scale,
		y: (screenPt.y - panY) / scale
	};
}

export function polygonsIntersect(first: Point[], second: Point[]): boolean {
	const pointInPolygon = (point: Point, polygon: Point[]) => {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const a = polygon[i];
			const b = polygon[j];
			const crosses = (a.y > point.y) !== (b.y > point.y) &&
				point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
			if (crosses) inside = !inside;
		}
		return inside;
	};

	const segmentsIntersect = (a: Point, b: Point, c: Point, d: Point) => {
		const orientation = (p: Point, q: Point, r: Point) =>
			(q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
		const onSegment = (p: Point, q: Point, r: Point) =>
			q.x >= Math.min(p.x, r.x) && q.x <= Math.max(p.x, r.x) &&
			q.y >= Math.min(p.y, r.y) && q.y <= Math.max(p.y, r.y);

		const abc = orientation(a, b, c);
		const abd = orientation(a, b, d);
		const cda = orientation(c, d, a);
		const cdb = orientation(c, d, b);

		if (((abc > 0 && abd < 0) || (abc < 0 && abd > 0)) &&
			((cda > 0 && cdb < 0) || (cda < 0 && cdb > 0))) return true;
		return (abc === 0 && onSegment(a, c, b)) ||
			(abd === 0 && onSegment(a, d, b)) ||
			(cda === 0 && onSegment(c, a, d)) ||
			(cdb === 0 && onSegment(c, b, d));
	};

	if (first.some((point) => pointInPolygon(point, second)) ||
		second.some((point) => pointInPolygon(point, first))) return true;

	for (let i = 0; i < first.length; i++) {
		const a = first[i];
		const b = first[(i + 1) % first.length];
		for (let j = 0; j < second.length; j++) {
			if (segmentsIntersect(a, b, second[j], second[(j + 1) % second.length])) return true;
		}
	}
	return false;
}
