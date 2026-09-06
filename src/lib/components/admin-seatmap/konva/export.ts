import Konva from 'konva';
import type { SeatmapDocument, SerializedNode, SeatProps } from '../types';

// ─── Walk mainLayer and serialize every node that has a 'kind' attr ───────────
export function buildDocument(
  mainLayer: Konva.Layer,
  canvasWidth: number,
  canvasHeight: number
): SeatmapDocument {
  const nodes: SerializedNode[] = [];

  mainLayer.getChildren().forEach((rawNode) => {
    const node = rawNode as Konva.Node;
    const kind = node.getAttr('kind') as string | undefined;
    if (!kind) return;

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

    nodes.push(base);
  });

  return { version: 1, canvasWidth, canvasHeight, nodes };
}

// ─── Trigger a browser file download of the JSON document ────────────────────
export function exportToJSON(
  mainLayer: Konva.Layer,
  canvasWidth: number,
  canvasHeight: number,
  filename = 'seatmap'
): SeatmapDocument {
  const doc = buildDocument(mainLayer, canvasWidth, canvasHeight);

  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return doc;
}
