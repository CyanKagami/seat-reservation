import type { CanvasConfig, SeatShape, SeatStatus, IconType } from './types';

/** Fixed undo/redo ring-buffer depth (confirmed requirement). */
export const HISTORY_MAX_DEPTH = 48;

/** Debounce window before an autosave draft write fires after the last change. */
export const AUTOSAVE_DEBOUNCE_MS = 2000;

export const DEFAULT_CANVAS: CanvasConfig = {
	width: 1000,
	height: 800,
	backgroundColor: '#ffffff',
	gridSize: 20,
	gridEnabled: true
};

export const DEFAULT_SEAT_WIDTH = 32;
export const DEFAULT_SEAT_HEIGHT = 32;
export const DEFAULT_SEAT_SHAPE: SeatShape = 'square';
export const DEFAULT_SEAT_STATUS: SeatStatus = 'available';

/** Editor-side visual cues for the "สถานะเก้าอี้" (seat status) dropdown. */
export const SEAT_STATUS_COLORS: Record<SeatStatus, string> = {
	available: '#d9d9d9',
	unavailable: '#e57373',
	held: '#ffb74d'
};

export const DEFAULT_SHAPE_FILL = '#cfd8dc';
export const DEFAULT_SHAPE_STROKE = '#607d8b';
export const DEFAULT_SHAPE_STROKE_WIDTH = 1;

export const DEFAULT_TEXT_FONT_SIZE = 16;
export const DEFAULT_TEXT_FONT_FAMILY = 'sans-serif';
export const DEFAULT_TEXT_FILL = '#000000';

/** Seats: rotate-only via the Transformer handle — no resize anchors (fixed width/height per seat). */
export const SEAT_RESIZABLE = false;

export const SEAT_STROKE_COLOR = '#9e9e9e';
export const SEAT_STROKE_WIDTH = 1;
export const SEAT_LABEL_FONT_SIZE = 10;
export const SEAT_LABEL_COLOR = '#424242';

/** ---------- Component palette ("องค์ประกอบ") ----------
 * Drives both the left sidebar's drag source list and the icon registry used
 * to render `IconElement`s on the canvas. Add a new preset by adding an entry
 * here and extending `IconType` in types.ts — nothing else needs to change.
 */
export interface IconDefinition {
	iconType: IconType;
	/** Thai label shown under the palette icon and used as default IconElement label */
	label: string;
	defaultWidth: number;
	defaultHeight: number;
}

export const ICON_LIBRARY: IconDefinition[] = [
	{ iconType: 'restroom', label: 'ห้องน้ำ', defaultWidth: 60, defaultHeight: 60 },
	{ iconType: 'door', label: 'ประตู', defaultWidth: 60, defaultHeight: 60 },
	{ iconType: 'stage', label: 'เวที', defaultWidth: 60, defaultHeight: 60 }
];
