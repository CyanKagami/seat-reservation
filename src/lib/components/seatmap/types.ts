/**
 * Seatmap data model.
 *
 * This is the shape that gets serialized to JSON on export/autosave, and is
 * the contract a future booking app consumes to render seats and let a user
 * pick one. `Seat.status` is set here in the editor (via the "สถานะเก้าอี้"
 * dropdown) as the seat's baseline availability (e.g. permanently broken /
 * out of service); a booking app is still expected to overlay live,
 * per-event reservation state on top of this, keyed by `Seat.id`, rather
 * than treat this file as the single source of truth for "is this seat
 * booked right now."
 *
 * v2 changes:
 * - Zones removed entirely (moved to a separate workflow, out of scope here).
 * - Seats now reference a `SeatType` (name + description capturing size /
 *   material) instead of a zone.
 * - Added `IconElement` for the draggable component palette (restroom, door,
 *   stage, ...) — quick presets distinct from the freehand rect/circle/polygon
 *   draw tools, which remain for custom symbols.
 */

/** ---------- Canvas ---------- */

export interface CanvasConfig {
	/** pixels */
	width: number;
	/** pixels */
	height: number;
	backgroundColor: string;
	gridSize: number;
	gridEnabled: boolean;
}

/** ---------- Seat types ("ลักษณะเก้าอี้") ----------
 * Replaces the earlier zone concept. Captures things like size & material
 * (e.g. "Standard plastic chair", "VIP leather armchair"). Managed via the
 * "เพิ่มชนิดเก้าอี้" (Add seat type) modal — name + free-text description.
 */
export interface SeatType {
	id: string;
	name: string;
	description: string;
}

/** ---------- Shared element base ---------- */

export type ElementType = 'seat' | 'rect' | 'circle' | 'polygon' | 'text' | 'group' | 'icon';

interface ElementBase {
	id: string;
	type: ElementType;
	x: number;
	y: number;
	/** degrees */
	rotation: number;
	/** paint/stacking order; higher draws on top */
	zIndex: number;
}

/** ---------- Seat ---------- */

export type SeatShape = 'square' | 'circle';

/** Baseline availability set in the editor via the "สถานะเก้าอี้" dropdown. */
export type SeatStatus = 'available' | 'unavailable' | 'held';

export interface Seat extends ElementBase {
	type: 'seat';
	shape: SeatShape;
	width: number;
	height: number;
	/** null = no type assigned */
	seatTypeId: string | null;
	/** shared id for seats created via "line of seats" / "2D array of seats"; null if placed individually */
	groupId: string | null;
	row: string | null;
	seatNumber: string | null;
	/** display override; defaults to `${row}${seatNumber}` when null */
	label: string | null;
	status: SeatStatus;
}

/** ---------- Symbol shapes (square / circle / polygon) — freehand-drawn symbols ---------- */

export interface RectShape extends ElementBase {
	type: 'rect';
	width: number;
	height: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
	label?: string;
}

export interface CircleShape extends ElementBase {
	type: 'circle';
	radius: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
	label?: string;
}

export interface PolygonShape extends ElementBase {
	type: 'polygon';
	/** flat [x0, y0, x1, y1, ...] pairs, relative to (x, y) */
	points: number[];
	closed: boolean;
	fill: string;
	stroke: string;
	strokeWidth: number;
	label?: string;
}

export type SymbolShape = RectShape | CircleShape | PolygonShape;

/** ---------- Icon elements ("องค์ประกอบ") — dragged in from the component palette ----------
 * Presets for common venue fixtures (restroom, door, stage). Shaped the same
 * way as `PolygonShape` — a `points` boundary the user can draw/resize just
 * like the polygon tool — rather than a fixed-size box, so an icon's footprint
 * can match the actual room/area it represents. The icon glyph + label render
 * centered inside that boundary (at its centroid) rather than the boundary
 * itself being decorative fill — `fill`/`stroke` here just style the boundary
 * outline the same way a symbol shape's does.
 *
 * Quick placement (click a palette item, click/drop on canvas) generates a
 * default rectangular `points` boundary sized from the icon's registry
 * default (see `ICON_LIBRARY`); the user can then drag its corners to
 * reshape/resize it, or — if a future "draw custom icon boundary" tool is
 * added — click out an arbitrary polygon instead, exactly like the polygon
 * draw tool. New presets are added by extending `IconType` + `ICON_LIBRARY`,
 * without touching this shape.
 */
export type IconType = 'restroom' | 'door' | 'stage';

export interface IconElement extends ElementBase {
	type: 'icon';
	iconType: IconType;
	/** flat [x0, y0, x1, y1, ...] pairs, relative to (x, y) — same shape model as PolygonShape.points */
	points: number[];
	closed: boolean;
	fill: string;
	stroke: string;
	strokeWidth: number;
	/** optional label override; defaults to the icon's registry display name (e.g. "ห้องน้ำ") */
	label?: string;
}

/** ---------- Text ---------- */

export interface TextElement extends ElementBase {
	type: 'text';
	content: string;
	fontSize: number;
	fontFamily: string;
	fill: string;
}

/** ---------- Group ----------
 * Container for "line of seats" / "2D array of seats" so the set can be
 * selected, moved, and rotated as one unit. Member seats stay flat, addressable
 * entries in `SeatMap.elements` (via `Seat.groupId`) rather than nested inside
 * the group, so hit-testing and rendering stay O(1)-lookup instead of tree-walked.
 */
export interface GroupElement extends ElementBase {
	type: 'group';
	childIds: string[];
}

export type SeatMapElement = Seat | RectShape | CircleShape | PolygonShape | IconElement | TextElement | GroupElement;

/** ---------- Root document ---------- */

export interface SeatMap {
	id: string;
	/** one seatmap per room; links back to whatever "Locations" entity owns this room */
	roomId: string;
	name: string;
	/** bumped on each explicit save; useful for conflict detection / migrations later */
	version: number;
	canvas: CanvasConfig;
	seatTypes: SeatType[];
	elements: SeatMapElement[];
	/** ISO 8601 */
	createdAt: string;
	/** ISO 8601 */
	updatedAt: string;
}
