import { nanoid } from 'nanoid';
import type {
	SeatMap,
	SeatMapElement,
	Seat,
	RectShape,
	CircleShape,
	PolygonShape,
	IconElement,
	IconType,
	TextElement,
	GroupElement,
	SeatType
} from './types';
import {
	DEFAULT_CANVAS,
	DEFAULT_SEAT_WIDTH,
	DEFAULT_SEAT_HEIGHT,
	DEFAULT_SEAT_SHAPE,
	DEFAULT_SEAT_STATUS,
	DEFAULT_SHAPE_FILL,
	DEFAULT_SHAPE_STROKE,
	DEFAULT_SHAPE_STROKE_WIDTH,
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_FONT_FAMILY,
	DEFAULT_TEXT_FILL,
	ICON_LIBRARY
} from './constants';

function nextZIndex(existing: SeatMapElement[]): number {
	return existing.length ? Math.max(...existing.map((e) => e.zIndex)) + 1 : 0;
}

/** ---------- Root document ---------- */

export function createEmptySeatMap(roomId: string, name: string): SeatMap {
	const now = new Date().toISOString();
	return {
		id: nanoid(),
		roomId,
		name,
		version: 1,
		canvas: { ...DEFAULT_CANVAS },
		seatTypes: [],
		elements: [],
		createdAt: now,
		updatedAt: now
	};
}

/** Created via the "เพิ่มชนิดเก้าอี้" (Add seat type) modal — name + free-text description (size & material). */
export function createSeatType(name: string, description: string): SeatType {
	return { id: nanoid(), name, description };
}

/** ---------- Single elements ---------- */

export function createSeat(x: number, y: number, existing: SeatMapElement[], overrides: Partial<Seat> = {}): Seat {
	return {
		id: nanoid(),
		type: 'seat',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		shape: DEFAULT_SEAT_SHAPE,
		width: DEFAULT_SEAT_WIDTH,
		height: DEFAULT_SEAT_HEIGHT,
		seatTypeId: null,
		groupId: null,
		row: null,
		seatNumber: null,
		label: null,
		status: DEFAULT_SEAT_STATUS,
		...overrides
	};
}

export function createRect(x: number, y: number, existing: SeatMapElement[], overrides: Partial<RectShape> = {}): RectShape {
	return {
		id: nanoid(),
		type: 'rect',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		width: 80,
		height: 80,
		fill: DEFAULT_SHAPE_FILL,
		stroke: DEFAULT_SHAPE_STROKE,
		strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
		...overrides
	};
}

export function createCircle(x: number, y: number, existing: SeatMapElement[], overrides: Partial<CircleShape> = {}): CircleShape {
	return {
		id: nanoid(),
		type: 'circle',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		radius: 40,
		fill: DEFAULT_SHAPE_FILL,
		stroke: DEFAULT_SHAPE_STROKE,
		strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
		...overrides
	};
}

export function createPolygon(
	x: number,
	y: number,
	points: number[],
	existing: SeatMapElement[],
	overrides: Partial<PolygonShape> = {}
): PolygonShape {
	return {
		id: nanoid(),
		type: 'polygon',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		points,
		closed: true,
		fill: DEFAULT_SHAPE_FILL,
		stroke: DEFAULT_SHAPE_STROKE,
		strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
		...overrides
	};
}

/**
 * Instantiates a palette component (restroom/door/stage/...) dropped onto
 * the canvas — generates a default rectangular `points` boundary (from the
 * icon's registry size), centered on (x, y). Pass `points` in `overrides` to
 * place a custom-drawn boundary instead (e.g. from a future click-to-draw
 * icon-boundary tool, reusing the same interaction as `createPolygon`).
 */
export function createIcon(
	x: number,
	y: number,
	iconType: IconType,
	existing: SeatMapElement[],
	overrides: Partial<IconElement> = {}
): IconElement {
	const def = ICON_LIBRARY.find((d) => d.iconType === iconType);
	const w = def?.defaultWidth ?? 60;
	const h = def?.defaultHeight ?? 60;
	const defaultPoints = [-w / 2, -h / 2, w / 2, -h / 2, w / 2, h / 2, -w / 2, h / 2];
	return {
		id: nanoid(),
		type: 'icon',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		iconType,
		points: defaultPoints,
		closed: true,
		fill: DEFAULT_SHAPE_FILL,
		stroke: DEFAULT_SHAPE_STROKE,
		strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
		label: def?.label,
		...overrides
	};
}

export function createText(
	x: number,
	y: number,
	content: string,
	existing: SeatMapElement[],
	overrides: Partial<TextElement> = {}
): TextElement {
	return {
		id: nanoid(),
		type: 'text',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		content,
		fontSize: DEFAULT_TEXT_FONT_SIZE,
		fontFamily: DEFAULT_TEXT_FONT_FAMILY,
		fill: DEFAULT_TEXT_FILL,
		...overrides
	};
}

export function createGroup(x: number, y: number, childIds: string[], existing: SeatMapElement[]): GroupElement {
	return {
		id: nanoid(),
		type: 'group',
		x,
		y,
		rotation: 0,
		zIndex: nextZIndex(existing),
		childIds
	};
}

/** ---------- Bulk seat creation ---------- */

/** A straight line of `count` seats, evenly spaced, tagged with a shared groupId. */
export function createSeatLine(
	startX: number,
	startY: number,
	count: number,
	spacing: number,
	orientation: 'horizontal' | 'vertical',
	row: string,
	existing: SeatMapElement[]
): Seat[] {
	const groupId = nanoid();
	let z = nextZIndex(existing);
	const seats: Seat[] = [];
	for (let i = 0; i < count; i++) {
		const x = orientation === 'horizontal' ? startX + i * spacing : startX;
		const y = orientation === 'vertical' ? startY + i * spacing : startY;
		seats.push({
			id: nanoid(),
			type: 'seat',
			x,
			y,
			rotation: 0,
			zIndex: z++,
			shape: DEFAULT_SEAT_SHAPE,
			width: DEFAULT_SEAT_WIDTH,
			height: DEFAULT_SEAT_HEIGHT,
			seatTypeId: null,
			groupId,
			row,
			seatNumber: String(i + 1),
			label: null,
			status: DEFAULT_SEAT_STATUS
		});
	}
	return seats;
}

/** A rows x cols grid of seats, tagged with a shared groupId. Row labels default to A, B, C... */
export function createSeatGrid(
	startX: number,
	startY: number,
	rows: number,
	cols: number,
	spacingX: number,
	spacingY: number,
	existing: SeatMapElement[],
	rowLabels: string[] = []
): Seat[] {
	const groupId = nanoid();
	let z = nextZIndex(existing);
	const seats: Seat[] = [];
	for (let r = 0; r < rows; r++) {
		const rowLabel = rowLabels[r] ?? String.fromCharCode(65 + r); // A, B, C...
		for (let c = 0; c < cols; c++) {
			seats.push({
				id: nanoid(),
				type: 'seat',
				x: startX + c * spacingX,
				y: startY + r * spacingY,
				rotation: 0,
				zIndex: z++,
				shape: DEFAULT_SEAT_SHAPE,
				width: DEFAULT_SEAT_WIDTH,
				height: DEFAULT_SEAT_HEIGHT,
				seatTypeId: null,
				groupId,
				row: rowLabel,
				seatNumber: String(c + 1),
				label: null,
				status: DEFAULT_SEAT_STATUS
			});
		}
	}
	return seats;
}
