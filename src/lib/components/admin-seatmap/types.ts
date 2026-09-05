// ─── Node kinds ───────────────────────────────────────────────────────────────
export type NodeKind =
  | 'seat'
  | 'shape_rect'
  | 'shape_circle'
  | 'shape_polygon'
  | 'text'
  | 'preset';

// ─── Tool modes ───────────────────────────────────────────────────────────────
export type ToolMode =
  | 'select'
  | 'add_seat'
  | 'add_row'
  | 'add_grid'
  | 'draw_rect'
  | 'draw_circle'
  | 'draw_polygon'
  | 'add_text';

// ─── Preset types ─────────────────────────────────────────────────────────────
export type PresetType = 'toilet' | 'door' | 'stage';

// ─── Seat properties ──────────────────────────────────────────────────────────
export type SeatStatus = 'available' | 'unavailable' | 'held';

export interface SeatProps {
  status: SeatStatus;
  chairType: string;
  description: string;
}

// ─── Row / grid placement configs ─────────────────────────────────────────────
export interface RowConfig {
  count: number;
  spacing: number; // px between seat origins
}

export interface GridConfig {
  rows: number;
  cols: number;
  spacingX: number;
  spacingY: number;
}

// ─── Serialisation ────────────────────────────────────────────────────────────
export interface SerializedNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  data: Record<string, unknown>;
  seatProps?: SeatProps;
}

export interface SeatmapDocument {
  version: 1;
  canvasWidth: number;
  canvasHeight: number;
  nodes: SerializedNode[];
}

// ─── UI labels (Thai) ─────────────────────────────────────────────────────────
export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  available: 'ว่าง',
  unavailable: 'ไม่ว่าง',
  held: 'จอง',
};

export const CHAIR_TYPES: string[] = [
  'Standard',
  'VIP',
  'Wheelchair',
  'Standing',
  'Folding',
];

export const PRESET_LABELS: Record<PresetType, string> = {
  toilet: 'ห้องน้ำ',
  door: 'ประตู',
  stage: 'เวที',
};

// ─── Visual constants ─────────────────────────────────────────────────────────
export const SEAT_SIZE = 40;
export const SEAT_CORNER_RADIUS = 6;
export const PRESET_SIZE = 80;
export const GRID_CELL = 20; // background grid spacing in px

export const SEAT_COLORS: Record<SeatStatus, { fill: string; stroke: string }> = {
  available: { fill: '#d1fae5', stroke: '#6ee7b7' },
  unavailable: { fill: '#fee2e2', stroke: '#fca5a5' },
  held: { fill: '#fef3c7', stroke: '#fcd34d' },
};

export const SEAT_SELECTED_COLORS = { fill: '#6366f1', stroke: '#4338ca' };
export const SEAT_DEFAULT_TEXT_COLOR = '#374151';
export const SEAT_SELECTED_TEXT_COLOR = '#ffffff';
