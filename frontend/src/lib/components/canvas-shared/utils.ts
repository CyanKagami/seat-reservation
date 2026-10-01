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
