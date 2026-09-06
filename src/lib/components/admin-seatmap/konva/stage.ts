import Konva from 'konva';
import { GRID_CELL } from '../types';

// ─── Public interface returned by createStage() ───────────────────────────────
export interface StageSetup {
  stage: Konva.Stage;
  bgLayer: Konva.Layer;
  mainLayer: Konva.Layer;
  uiLayer: Konva.Layer;
}

// ─── Create the Konva stage with three layers ─────────────────────────────────
export function createStage(
  container: HTMLDivElement,
  canvasWidth: number,
  canvasHeight: number
): StageSetup {
  const stage = new Konva.Stage({
    container,
    width: container.clientWidth,
    height: container.clientHeight,
  });

  // bgLayer  – white canvas + dot-grid (non-interactive, cached)
  // mainLayer – all user nodes (seats, shapes, presets, text)
  // uiLayer  – transformer, marquee rect, drawing previews (non-interactive)
  const bgLayer = new Konva.Layer({ listening: false });
  const mainLayer = new Konva.Layer();
  const uiLayer = new Konva.Layer({ listening: false });

  stage.add(bgLayer);
  stage.add(mainLayer);
  stage.add(uiLayer);

  drawBackground(bgLayer, canvasWidth, canvasHeight);
  setupZoomPan(stage);

  return { stage, bgLayer, mainLayer, uiLayer };
}

// ─── Re-draw the background (call on canvas resize) ───────────────────────────
export function updateBackground(
  bgLayer: Konva.Layer,
  canvasWidth: number,
  canvasHeight: number
) {
  drawBackground(bgLayer, canvasWidth, canvasHeight);
}

function drawBackground(layer: Konva.Layer, w: number, h: number) {
  layer.destroyChildren();

  // White canvas surface with subtle drop shadow
  layer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: w,
      height: h,
      fill: 'white',
      shadowColor: 'rgba(0,0,0,0.18)',
      shadowBlur: 24,
      shadowOffset: { x: 3, y: 3 },
      listening: false,
    })
  );

  // Dot-grid overlay
  layer.add(
    new Konva.Shape({
      x: 0,
      y: 0,
      listening: false,
      sceneFunc(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 0.5;
        for (let x = GRID_CELL; x < w; x += GRID_CELL) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = GRID_CELL; y < h; y += GRID_CELL) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let x = GRID_CELL; x < w; x += GRID_CELL) {
          for (let y = GRID_CELL; y < h; y += GRID_CELL) {
            ctx.arc(x, y, 0.8, 0, Math.PI * 2);
            ctx.closePath();
          }
        }
        ctx.fill();
      },
    })
  );

  layer.batchDraw();
}

// ─── Zoom (mouse-wheel) + pan (middle-mouse-drag / Space+drag) ────────────────
const MIN_SCALE = 0.08;
const MAX_SCALE = 8;

function setupZoomPan(stage: Konva.Stage) {
  // Focal-point zoom on wheel
  stage.on('wheel', (e) => {
    e.evt.preventDefault();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition()!;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const factor = 1.1;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, direction > 0 ? oldScale * factor : oldScale / factor)
    );

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    stage.batchDraw();
  });

  // Middle-mouse-button pan
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let stageStart = { x: 0, y: 0 };

  stage.on('mousedown', (e) => {
    if (e.evt.button !== 1) return;
    e.evt.preventDefault();
    isPanning = true;
    panStart = { x: e.evt.clientX, y: e.evt.clientY };
    stageStart = { x: stage.x(), y: stage.y() };
    stage.container().style.cursor = 'grabbing';
  });

  stage.on('mousemove', (e) => {
    if (!isPanning) return;
    stage.position({
      x: stageStart.x + e.evt.clientX - panStart.x,
      y: stageStart.y + e.evt.clientY - panStart.y,
    });
    stage.batchDraw();
  });

  stage.on('mouseup', (e) => {
    if (e.evt.button !== 1) return;
    isPanning = false;
    stage.container().style.cursor = '';
  });

  // Context-menu prevention
  stage.container().addEventListener('contextmenu', (e) => e.preventDefault());
}

// ─── Center + fit the canvas in the container on first load ───────────────────
export function centerStageOnCanvas(
  stage: Konva.Stage,
  canvasWidth: number,
  canvasHeight: number
) {
  const cw = stage.width();
  const ch = stage.height();
  const scale = Math.min((cw * 0.88) / canvasWidth, (ch * 0.88) / canvasHeight, 1);
  stage.scale({ x: scale, y: scale });
  stage.position({
    x: (cw - canvasWidth * scale) / 2,
    y: (ch - canvasHeight * scale) / 2,
  });
  stage.batchDraw();
}

// ─── Resize the stage to fill its container ───────────────────────────────────
export function resizeStage(stage: Konva.Stage, container: HTMLDivElement) {
  stage.width(container.clientWidth);
  stage.height(container.clientHeight);
  stage.batchDraw();
}
