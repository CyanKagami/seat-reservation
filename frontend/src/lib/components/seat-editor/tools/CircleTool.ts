import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point, Rect } from '../types';
import { GRID_SIZE } from '../constants';

export class CircleToolStrategy extends BaseToolStrategy {
	readonly id = 'add-circle';

	calculateCircleBounds(
		startScreen: Point,
		endScreen: Point,
		isShiftPressed: boolean,
		state: ToolContext['state']
	): Rect {
		const canvasWidth = state.gridWidth * GRID_SIZE;
		const canvasHeight = state.gridHeight * GRID_SIZE;
		const rawStart = this.screenToCanvas(startScreen, state.panX, state.panY, state.scale);
		const rawEnd = this.screenToCanvas(endScreen, state.panX, state.panY, state.scale);
		const p1 = {
			x: Math.max(0, Math.min(canvasWidth, rawStart.x)),
			y: Math.max(0, Math.min(canvasHeight, rawStart.y))
		};
		let p2 = {
			x: Math.max(0, Math.min(canvasWidth, rawEnd.x)),
			y: Math.max(0, Math.min(canvasHeight, rawEnd.y))
		};

		let dx = p2.x - p1.x;
		let dy = p2.y - p1.y;

		// Constrain to perfect circle (1:1 ratio) when Shift is held
		if (isShiftPressed) {
			const signX = dx >= 0 ? 1 : -1;
			const signY = dy >= 0 ? 1 : -1;
			const availableWidth = signX > 0 ? canvasWidth - p1.x : p1.x;
			const availableHeight = signY > 0 ? canvasHeight - p1.y : p1.y;
			const size = Math.min(Math.max(Math.abs(dx), Math.abs(dy)), availableWidth, availableHeight);

			p2 = {
				x: p1.x + size * signX,
				y: p1.y + size * signY
			};
			dx = p2.x - p1.x;
			dy = p2.y - p1.y;
		}

		return {
			x: Math.min(p1.x, p2.x),
			y: Math.min(p1.y, p2.y),
			width: Math.abs(dx),
			height: Math.abs(dy)
		};
	}

	override onMouseDown({ state, screenPoint }: ToolContext) {
		state.isCircleDrawing = true;
		state.circleStart = screenPoint;
		state.circleEnd = screenPoint;
	}

	override onMouseMove({ state, screenPoint }: ToolContext) {
		if (state.isCircleDrawing) {
			state.circleEnd = screenPoint;
		}
	}

	override onMouseUp({ state, event, screenPoint }: ToolContext) {
		if (!state.isCircleDrawing) return;
		state.circleEnd = screenPoint;

		const bounds = this.calculateCircleBounds(
			state.circleStart,
			state.circleEnd,
			event.shiftKey,
			state
		);

		if (bounds.width > 5 && bounds.height > 5) {
			const newCircle = {
				id: state.createObjectId('env_circle'),
				type: 'env-circle' as const,
				x: bounds.x,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height,
				metadata: {}
			};

			state.objects = [...state.objects, newCircle];
			state.selectedIds = new Set([newCircle.id]);
		}

		state.isCircleDrawing = false;
	}
}