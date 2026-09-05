import Konva from 'konva';
import type { CanvasConfig } from '../types';

export interface SeatmapLayers {
	background: Konva.Layer;
	seats: Konva.Layer;
	shapes: Konva.Layer;
	ui: Konva.Layer;
}

export interface StageManager {
	stage: Konva.Stage;
	layers: SeatmapLayers;
	/** Applies width/height/backgroundColor/grid in one call — `CanvasConfig` from the store is the single source of truth for all of these. */
	setCanvasConfig(config: CanvasConfig): void;
	destroy(): void;
}

const GRID_COLOR = '#e0e0e0';

function drawBackground(layer: Konva.Layer, config: CanvasConfig): void {
	layer.destroyChildren();

	layer.add(
		new Konva.Rect({
			x: 0,
			y: 0,
			width: config.width,
			height: config.height,
			fill: config.backgroundColor,
			listening: false
		})
	);

	if (config.gridEnabled && config.gridSize > 0) {
		// One custom-drawn shape for the whole grid rather than a Konva.Line
		// per line — cheap even at large canvas sizes, and never part of hit-testing.
		layer.add(
			new Konva.Shape({
				listening: false,
				sceneFunc(ctx, shape) {
					ctx.beginPath();
					for (let x = config.gridSize; x < config.width; x += config.gridSize) {
						ctx.moveTo(x, 0);
						ctx.lineTo(x, config.height);
					}
					for (let y = config.gridSize; y < config.height; y += config.gridSize) {
						ctx.moveTo(0, y);
						ctx.lineTo(config.width, y);
					}
					ctx.strokeShape(shape);
				},
				stroke: GRID_COLOR,
				strokeWidth: 1
			})
		);
	}

	layer.batchDraw();
}

/**
 * Owns the imperative Konva side of the editor — the Stage and its layers.
 * Created once per editor instance from `onMount` (Konva must never be
 * instantiated during SSR — see SeatmapEditor.svelte's dynamic import of
 * this module).
 *
 * Four layers, bottom to top, matching the plan's performance section:
 * - `background`: the canvas-size rect + grid. Redrawn only on canvas config changes.
 * - `seats`: the (potentially 1000+) seat nodes. Redrawn rarely — on
 *   add/remove/bulk-edit, never on every selection change.
 * - `shapes`: symbol shapes, icons, text — comparatively few nodes, drawn
 *   above seats so room markers/labels aren't hidden underneath them.
 * - `ui`: selection rectangle, `Konva.Transformer`. Redraws constantly
 *   during drag/resize/rotate; isolated on its own layer so that repainting
 *   never touches (and never has to re-composite) the seat layer.
 */
export function createStageManager(container: HTMLDivElement, initialConfig: CanvasConfig): StageManager {
	const stage = new Konva.Stage({
		container,
		width: initialConfig.width,
		height: initialConfig.height
	});

	const background = new Konva.Layer();
	const seats = new Konva.Layer();
	const shapes = new Konva.Layer();
	const ui = new Konva.Layer();

	stage.add(background);
	stage.add(seats);
	stage.add(shapes);
	stage.add(ui);

	drawBackground(background, initialConfig);

	function setCanvasConfig(config: CanvasConfig): void {
		stage.width(config.width);
		stage.height(config.height);
		drawBackground(background, config);
	}

	function destroy(): void {
		stage.destroy();
	}

	return { stage, layers: { background, seats, shapes, ui }, setCanvasConfig, destroy };
}
