import type {
	SeatMapElement,
	Seat,
	RectShape,
	CircleShape,
	PolygonShape,
	SymbolShape,
	IconElement,
	TextElement,
	GroupElement
} from './types';

export function isSeat(el: SeatMapElement): el is Seat {
	return el.type === 'seat';
}

export function isRect(el: SeatMapElement): el is RectShape {
	return el.type === 'rect';
}

export function isCircle(el: SeatMapElement): el is CircleShape {
	return el.type === 'circle';
}

export function isPolygon(el: SeatMapElement): el is PolygonShape {
	return el.type === 'polygon';
}

/** Any of the three freehand "symbol" shapes drawn via the square/circle/polygon tools. */
export function isSymbolShape(el: SeatMapElement): el is SymbolShape {
	return el.type === 'rect' || el.type === 'circle' || el.type === 'polygon';
}

/** A preset component dragged in from the palette (restroom, door, stage, ...). */
export function isIcon(el: SeatMapElement): el is IconElement {
	return el.type === 'icon';
}

export function isText(el: SeatMapElement): el is TextElement {
	return el.type === 'text';
}

export function isGroup(el: SeatMapElement): el is GroupElement {
	return el.type === 'group';
}
