import Konva from 'konva';
import { nanoid } from 'nanoid';
import {
  SEAT_SIZE,
  SEAT_CORNER_RADIUS,
  SEAT_COLORS,
  SEAT_SELECTED_COLORS,
  SEAT_DEFAULT_TEXT_COLOR,
  SEAT_SELECTED_TEXT_COLOR,
  type SeatProps,
  type RowConfig,
  type GridConfig,
} from '../types';

// ─── Create a single seat Konva.Group ─────────────────────────────────────────
export function createSeatGroup(
  x: number,
  y: number,
  label: string,
  props: SeatProps = { status: 'available', chairType: 'Standard', description: '' }
): Konva.Group {
  const colors = SEAT_COLORS[props.status];

  const group = new Konva.Group({
    id: nanoid(),
    x,
    y,
    draggable: true,
    name: 'selectable',
  });

  group.setAttr('kind', 'seat');
  group.setAttr('seatProps', { ...props });
  group.setAttr('seatLabel', label);

  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    fill: colors.fill,
    stroke: colors.stroke,
    strokeWidth: 1.5,
    cornerRadius: SEAT_CORNER_RADIUS,
    name: 'seat-rect',
    listening: false,
  });

  const text = new Konva.Text({
    x: 0,
    y: 0,
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    text: label,
    fontSize: 10,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: SEAT_DEFAULT_TEXT_COLOR,
    align: 'center',
    verticalAlign: 'middle',
    listening: false,
    name: 'seat-label',
  });

  group.add(rect, text);
  return group;
}

// ─── Update seat visual based on selection state ──────────────────────────────
export function applySeatSelection(group: Konva.Group, selected: boolean) {
  const props = group.getAttr('seatProps') as SeatProps;
  const rect = group.findOne<Konva.Rect>('.seat-rect')!;
  const label = group.findOne<Konva.Text>('.seat-label')!;

  if (selected) {
    rect.fill(SEAT_SELECTED_COLORS.fill);
    rect.stroke(SEAT_SELECTED_COLORS.stroke);
    rect.strokeWidth(2.5);
    label.fill(SEAT_SELECTED_TEXT_COLOR);
  } else {
    const colors = SEAT_COLORS[props.status];
    rect.fill(colors.fill);
    rect.stroke(colors.stroke);
    rect.strokeWidth(1.5);
    label.fill(SEAT_DEFAULT_TEXT_COLOR);
  }
}

// ─── Update seat properties and repaint ───────────────────────────────────────
export function updateSeatProps(group: Konva.Group, props: SeatProps) {
  group.setAttr('seatProps', { ...props });
  applySeatSelection(group, false);
}

// ─── Add one seat at (x, y), auto-labelled ────────────────────────────────────
export function addOneSeat(
  layer: Konva.Layer,
  x: number,
  y: number,
  label?: string
): Konva.Group {
  const idx = layer.find('.selectable[kind="seat"]').length + 1;
  const group = createSeatGroup(x - SEAT_SIZE / 2, y - SEAT_SIZE / 2, label ?? `S${idx}`);
  layer.add(group);
  layer.batchDraw();
  return group;
}

// ─── Add a horizontal row of seats ────────────────────────────────────────────
export function addSeatRow(
  layer: Konva.Layer,
  startX: number,
  startY: number,
  config: RowConfig
): Konva.Group[] {
  const { count, spacing } = config;
  const baseIdx = layer.find('.selectable').length;
  const groups: Konva.Group[] = [];

  for (let i = 0; i < count; i++) {
    const g = createSeatGroup(startX + i * spacing, startY, `S${baseIdx + i + 1}`);
    layer.add(g);
    groups.push(g);
  }

  layer.batchDraw();
  return groups;
}

// ─── Add a 2-D grid of seats with row-letter / col-number labels ──────────────
export function addSeatGrid(
  layer: Konva.Layer,
  startX: number,
  startY: number,
  config: GridConfig
): Konva.Group[] {
  const { rows, cols, spacingX, spacingY } = config;
  const groups: Konva.Group[] = [];

  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + (r % 26));
    for (let c = 0; c < cols; c++) {
      const g = createSeatGroup(
        startX + c * spacingX,
        startY + r * spacingY,
        `${rowLetter}${c + 1}`
      );
      layer.add(g);
      groups.push(g);
    }
  }

  layer.batchDraw();
  return groups;
}
