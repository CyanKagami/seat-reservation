import Konva from 'konva';
import { nanoid } from 'nanoid';
import type { ToolMode } from '../types';

// ─── DrawingManager – manages rubber-band rect/circle and polygon click-to-draw ─
export class DrawingManager {
  private stage: Konva.Stage;
  private mainLayer: Konva.Layer;
  private uiLayer: Konva.Layer;

  // Rubber-band state (rect / circle)
  private previewShape: Konva.Shape | null = null;
  private drawStart: { x: number; y: number } | null = null;

  // Polygon state
  private polyPoints: number[] = [];
  private polyLine: Konva.Line | null = null;
  private polyPreview: Konva.Line | null = null;
  private polyStartDot: Konva.Circle | null = null;

  /** Called after a shape is committed to mainLayer – wire up node handlers */
  onShapeCommitted?: (node: Konva.Node) => void;

  constructor(stage: Konva.Stage, mainLayer: Konva.Layer, uiLayer: Konva.Layer) {
    this.stage = stage;
    this.mainLayer = mainLayer;
    this.uiLayer = uiLayer;
  }

  // ── Rubber-band (rect / circle) ─────────────────────────────────────────────

  startDraw(tool: ToolMode, pos: { x: number; y: number }) {
    this.drawStart = { ...pos };

    if (tool === 'draw_rect') {
      this.previewShape = new Konva.Rect({
        x: pos.x, y: pos.y,
        width: 0, height: 0,
        fill: 'rgba(99,102,241,0.12)',
        stroke: '#6366f1',
        strokeWidth: 1.5,
        dash: [5, 4],
        listening: false,
      });
    } else if (tool === 'draw_circle') {
      this.previewShape = new Konva.Ellipse({
        x: pos.x, y: pos.y,
        radiusX: 0, radiusY: 0,
        fill: 'rgba(99,102,241,0.12)',
        stroke: '#6366f1',
        strokeWidth: 1.5,
        dash: [5, 4],
        listening: false,
      });
    }

    if (this.previewShape) this.uiLayer.add(this.previewShape);
  }

  moveDraw(tool: ToolMode, pos: { x: number; y: number }) {
    if (!this.previewShape || !this.drawStart) return;

    if (tool === 'draw_rect') {
      const r = this.previewShape as Konva.Rect;
      r.setAttrs({
        x: Math.min(pos.x, this.drawStart.x),
        y: Math.min(pos.y, this.drawStart.y),
        width: Math.abs(pos.x - this.drawStart.x),
        height: Math.abs(pos.y - this.drawStart.y),
      });
    } else if (tool === 'draw_circle') {
      const e = this.previewShape as Konva.Ellipse;
      e.setAttrs({
        x: (pos.x + this.drawStart.x) / 2,
        y: (pos.y + this.drawStart.y) / 2,
        radiusX: Math.abs(pos.x - this.drawStart.x) / 2,
        radiusY: Math.abs(pos.y - this.drawStart.y) / 2,
      });
    }
    this.uiLayer.batchDraw();
  }

  commitDraw(tool: ToolMode): Konva.Shape | null {
    if (!this.previewShape || !this.drawStart) return null;

    let finalNode: Konva.Shape | null = null;

    if (tool === 'draw_rect') {
      const r = this.previewShape as Konva.Rect;
      if (r.width() < 4 || r.height() < 4) {
        this.cancelDraw();
        return null;
      }
      finalNode = new Konva.Rect({
        id: nanoid(),
        x: r.x(), y: r.y(),
        width: r.width(), height: r.height(),
        fill: 'rgba(209,213,219,0.45)',
        stroke: '#9ca3af',
        strokeWidth: 1.5,
        cornerRadius: 4,
        draggable: true,
        name: 'selectable',
      });
      finalNode.setAttr('kind', 'shape_rect');
    } else if (tool === 'draw_circle') {
      const e = this.previewShape as Konva.Ellipse;
      if (e.radiusX() < 4 || e.radiusY() < 4) {
        this.cancelDraw();
        return null;
      }
      finalNode = new Konva.Ellipse({
        id: nanoid(),
        x: e.x(), y: e.y(),
        radiusX: e.radiusX(), radiusY: e.radiusY(),
        fill: 'rgba(209,213,219,0.45)',
        stroke: '#9ca3af',
        strokeWidth: 1.5,
        draggable: true,
        name: 'selectable',
      });
      finalNode.setAttr('kind', 'shape_circle');
    }

    this.previewShape.destroy();
    this.previewShape = null;
    this.drawStart = null;
    this.uiLayer.batchDraw();

    if (finalNode) {
      this.mainLayer.add(finalNode);
      this.mainLayer.batchDraw();
      this.onShapeCommitted?.(finalNode);
    }

    return finalNode;
  }

  cancelDraw() {
    this.previewShape?.destroy();
    this.previewShape = null;
    this.drawStart = null;
    this.uiLayer.batchDraw();
  }

  isDrawing(): boolean {
    return this.previewShape !== null;
  }

  // ── Polygon click-to-draw ───────────────────────────────────────────────────

  addPolyVertex(pos: { x: number; y: number }) {
    // Snap to start point if close enough
    if (this.polyPoints.length >= 6) {
      const [fx, fy] = this.polyPoints;
      const scale = this.stage.scaleX();
      if (Math.hypot((pos.x - fx) * scale, (pos.y - fy) * scale) < 12) {
        this.commitPolygon();
        return;
      }
    }

    this.polyPoints.push(pos.x, pos.y);

    if (!this.polyLine) {
      // First vertex: create the main line + start indicator dot
      this.polyLine = new Konva.Line({
        points: [...this.polyPoints],
        stroke: '#6366f1',
        strokeWidth: 1.5,
        dash: [5, 4],
        listening: false,
      });
      this.polyStartDot = new Konva.Circle({
        x: pos.x, y: pos.y,
        radius: 5 / this.stage.scaleX(),
        fill: '#6366f1',
        stroke: 'white',
        strokeWidth: 1,
        listening: false,
      });
      this.uiLayer.add(this.polyLine, this.polyStartDot);
    } else {
      this.polyLine.points([...this.polyPoints]);
    }

    this.uiLayer.batchDraw();
  }

  movePolyPreview(pos: { x: number; y: number }) {
    if (this.polyPoints.length === 0) return;

    const lastX = this.polyPoints[this.polyPoints.length - 2];
    const lastY = this.polyPoints[this.polyPoints.length - 1];

    if (!this.polyPreview) {
      this.polyPreview = new Konva.Line({
        points: [],
        stroke: '#6366f1',
        strokeWidth: 1,
        dash: [3, 3],
        opacity: 0.6,
        listening: false,
      });
      this.uiLayer.add(this.polyPreview);
    }
    this.polyPreview.points([lastX, lastY, pos.x, pos.y]);
    this.uiLayer.batchDraw();
  }

  finishPolyOnDblClick() {
    if (this.polyPoints.length >= 6) {
      // Remove last duplicated point added by dblclick
      this.polyPoints.splice(-2);
      this.commitPolygon();
    }
  }

  cancelPolygon() {
    this.polyLine?.destroy();
    this.polyPreview?.destroy();
    this.polyStartDot?.destroy();
    this.polyLine = null;
    this.polyPreview = null;
    this.polyStartDot = null;
    this.polyPoints = [];
    this.uiLayer.batchDraw();
  }

  isPolygonInProgress(): boolean {
    return this.polyPoints.length > 0;
  }

  private commitPolygon() {
    if (this.polyPoints.length < 6) {
      this.cancelPolygon();
      return;
    }

    const finalPoly = new Konva.Line({
      id: nanoid(),
      points: [...this.polyPoints],
      fill: 'rgba(209,213,219,0.45)',
      stroke: '#9ca3af',
      strokeWidth: 1.5,
      closed: true,
      draggable: true,
      name: 'selectable',
    });
    finalPoly.setAttr('kind', 'shape_polygon');

    this.mainLayer.add(finalPoly);
    this.mainLayer.batchDraw();
    this.cancelPolygon();
    this.onShapeCommitted?.(finalPoly);
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  cancelAll() {
    this.cancelDraw();
    this.cancelPolygon();
  }
}

// ─── Create a Konva.Text node (called after text input is confirmed) ───────────
export function createTextNode(
  x: number,
  y: number,
  text: string,
  fontSize = 16
): Konva.Text {
  const node = new Konva.Text({
    id: nanoid(),
    x,
    y,
    text,
    fontSize,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#1f2937',
    draggable: true,
    name: 'selectable',
  });
  node.setAttr('kind', 'text');
  return node;
}
