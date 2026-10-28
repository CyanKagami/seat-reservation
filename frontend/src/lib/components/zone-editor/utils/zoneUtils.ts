import type { CanvasObject } from "../types";

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

export function getSeatId(object:CanvasObject) {
	if (object.type !== "seat") {
		throw Error('Argument is not a seat object');
	}
	return getSeatLabel(object);
}

export function getSeatLabel(object: CanvasObject) {
	if (object.type !== "seat") {
		throw Error('Argument is not a seat object');
	}
	const row = object.metadata?.row?.trim() ?? '';
	const seatNo = object.metadata?.seatNo?.trim() ?? '';
	if (row && seatNo) return `${row}${seatNo}`;
	return object.metadata?.label?.trim() || object.label?.trim() || '';
}

export function getReservationSeatId(object: CanvasObject) {
	if (object.type !== "seat") {
		throw Error('Argument is not a seat object');
	}
	const storedId = object.metadata?.reservationId;
	if (isInternalReservationSeatId(storedId)) {
		return storedId;
	}
	const internalId = object.id;
	const encodedId = Array.from(new TextEncoder().encode(internalId), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('');
	return `seatkey_legacy_${encodedId}`;
}

export function isInternalReservationSeatId(value: unknown): value is string {
	return typeof value === 'string' &&
		(/^(?:S-[0-9A-HJKMNP-TV-Z]{10}|seatkey_(?:[a-f0-9]{32}|legacy_[a-f0-9]+))$/).test(value);
}

export function ensureReadableReservationSeatIds(objects: CanvasObject[]) {
	const usedIds = new Set(
		objects
			.filter((object) => object.type === 'seat')
			.map((object) => getReservationSeatId(object))
			.filter(isReadableReservationSeatId)
	);

	return objects.map((object) => {
		if (object.type !== 'seat') return object;

		const previousId = getReservationSeatId(object);
		const reservationId = isReadableReservationSeatId(previousId)
			? previousId
			: createReservationSeatId(usedIds);
		usedIds.add(reservationId);

		const legacyReservationIds = new Set(getLegacySeatIds(object));
		if (previousId !== reservationId) legacyReservationIds.add(previousId);

		return {
			...object,
			metadata: {
				...(object.metadata ?? {}),
				reservationId,
				legacyReservationIds: [...legacyReservationIds].filter((id) => id !== reservationId)
			}
		};
	});
}

function isReadableReservationSeatId(value: string): boolean {
	return /^S-[0-9A-HJKMNP-TV-Z]{10}$/.test(value);
}

export function getLegacySeatIds(object: CanvasObject) {
	if (object.type !== "seat") {
		throw Error('Argument is not a seat object');
	}
	const storedIds = Array.isArray(object.metadata?.legacyReservationIds)
		? object.metadata.legacyReservationIds.filter((id: unknown): id is string => typeof id === 'string')
		: [];
	const zone = typeof object.metadata?.zone === 'string' ? object.metadata.zone : '';
	const label = getSeatLabel(object);
	return [...new Set([...storedIds, ...(zone && label ? [`${zone}-${label}`] : [])])];
}

export function createReservationSeatId(reservedIds: Iterable<string> = []) {
	const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
	const usedIds = new Set(reservedIds);
	let reservationId: string;
	do {
		const bytes = new Uint8Array(10);
		globalThis.crypto.getRandomValues(bytes);
		reservationId = `S-${Array.from(bytes, (byte) => alphabet[byte & 31]).join('')}`;
	} while (usedIds.has(reservationId));
	return reservationId;
}