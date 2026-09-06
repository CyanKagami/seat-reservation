import Konva from 'konva';
import { nanoid } from 'nanoid';
import { createSeatGroup } from './seat';
import { createPreset } from './preset';
import type { SerializedNode, SeatProps, PresetType } from '../types';

// ─── Module-level clipboard (persists between copy/paste calls) ───────────────
let clipboard: SerializedNode[] = [];

// ─── Serialize a single Konva node to a plain object ─────────────────────────
function serializeNode(node: Konva.Node): SerializedNode | null {
  const kind = node.getAttr('kind') as string | undefined;
  if (!kind) return null;

  const base: SerializedNode = {
    id: node.id(),
    kind: kind as SerializedNode['kind'],
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    data: {},
    seatProps: node.getAttr('seatProps') as SeatProps | undefined,
  };

  if (node instanceof Konva.Group) {
    base.data.label = node.getAttr('seatLabel') ?? '';
    base.data.presetType = node.getAttr('presetType') ?? null;
  } else if (node instanceof Konva.Rect) {
    base.data.width = node.width();
    base.data.height = node.height();
    base.data.fill = node.fill();
    base.data.stroke = node.stroke();
  } else if (node instanceof Konva.Ellipse) {
    base.data.radiusX = node.radiusX();
    base.data.radiusY = node.radiusY();
  } else if (node instanceof Konva.Line) {
    base.data.points = [...node.points()];
    base.data.closed = node.closed();
  } else if (node instanceof Konva.Text) {
    base.data.text = node.text();
    base.data.fontSize = node.fontSize();
  }

  return base;
}

// ─── Copy selected nodes into clipboard ───────────────────────────────────────
export function copyNodes(nodes: Konva.Node[]) {
  clipboard = nodes.map(serializeNode).filter(Boolean) as SerializedNode[];
}

// ─── Paste clipboard nodes into layer, offset by (OFFSET, OFFSET) ─────────────
const OFFSET = 20;

export function pasteNodes(layer: Konva.Layer): Konva.Node[] {
  if (clipboard.length === 0) return [];

  const pasted: Konva.Node[] = [];

  for (const s of clipboard) {
    let node: Konva.Node | null = null;

    if (s.kind === 'seat') {
      node = createSeatGroup(
        s.x + OFFSET,
        s.y + OFFSET,
        (s.data.label as string) ?? 'S',
        s.seatProps
      );
    } else if (s.kind === 'preset') {
      node = createPreset(s.data.presetType as PresetType, s.x + OFFSET, s.y + OFFSET);
    } else if (s.kind === 'shape_rect') {
      const n = new Konva.Rect({
        id: nanoid(),
        x: s.x + OFFSET,
        y: s.y + OFFSET,
        width: s.data.width as number,
        height: s.data.height as number,
        fill: (s.data.fill as string) ?? 'rgba(209,213,219,0.45)',
        stroke: (s.data.stroke as string) ?? '#9ca3af',
        strokeWidth: 1.5,
        cornerRadius: 4,
        draggable: true,
        name: 'selectable',
      });
      n.setAttr('kind', 'shape_rect');
      node = n;
    } else if (s.kind === 'shape_circle') {
      const n = new Konva.Ellipse({
        id: nanoid(),
        x: s.x + OFFSET,
        y: s.y + OFFSET,
        radiusX: s.data.radiusX as number,
        radiusY: s.data.radiusY as number,
        fill: 'rgba(209,213,219,0.45)',
        stroke: '#9ca3af',
        strokeWidth: 1.5,
        draggable: true,
        name: 'selectable',
      });
      n.setAttr('kind', 'shape_circle');
      node = n;
    } else if (s.kind === 'shape_polygon') {
      const pts = (s.data.points as number[]).map((v, i) =>
        i % 2 === 0 ? v + OFFSET : v + OFFSET
      );
      const n = new Konva.Line({
        id: nanoid(),
        points: pts,
        fill: 'rgba(209,213,219,0.45)',
        stroke: '#9ca3af',
        strokeWidth: 1.5,
        closed: true,
        draggable: true,
        name: 'selectable',
      });
      n.setAttr('kind', 'shape_polygon');
      node = n;
    } else if (s.kind === 'text') {
      const n = new Konva.Text({
        id: nanoid(),
        x: s.x + OFFSET,
        y: s.y + OFFSET,
        text: (s.data.text as string) ?? '',
        fontSize: (s.data.fontSize as number) ?? 16,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: '#1f2937',
        draggable: true,
        name: 'selectable',
      });
      n.setAttr('kind', 'text');
      node = n;
    }

    if (node) {
      node.rotation(s.rotation);
      node.scaleX(s.scaleX);
      node.scaleY(s.scaleY);
      layer.add(node as Konva.Shape);
      pasted.push(node);
    }
  }

  // Update clipboard so the next paste offsets again
  clipboard = pasted.map(serializeNode).filter(Boolean) as SerializedNode[];

  layer.batchDraw();
  return pasted;
}

export function hasClipboard(): boolean {
  return clipboard.length > 0;
}
