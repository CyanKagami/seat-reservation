import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point, Rect } from '../types';

export class RectToolStrategy extends BaseToolStrategy {
	readonly id = 'add-rect';

	calculateRectBounds(
		startScreen: Point,
		endScreen: Point,
		isShiftPressed: boolean,
		state: ToolContext['state']
	): Rect {
		const p1 = this.screenToCanvas(startScreen, state.panX, state.panY, state.scale);
		let p2 = this.screenToCanvas(endScreen, state.panX, state.panY, state.scale);

		let dx = p2.x - p1.x;
		let dy = p2.y - p1.y;

		// Constrain to perfect square (1:1 ratio) when Shift is held
		if (isShiftPressed) {
			const size = Math.max(Math.abs(dx), Math.abs(dy));
			const signX = dx >= 0 ? 1 : -1;
			const signY = dy >= 0 ? 1 : -1;

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
		state.isRectDrawing = true;
		state.rectStart = screenPoint;
		state.rectEnd = screenPoint;
	}

	override onMouseMove({ state, screenPoint }: ToolContext) {
		if (state.isRectDrawing) {
			state.rectEnd = screenPoint;
		}
	}

	override onMouseUp({ state, event }: ToolContext) {
		if (!state.isRectDrawing) return;

		const bounds = this.calculateRectBounds(
			state.rectStart,
			state.rectEnd,
			event.shiftKey,
			state
		);

		if (bounds.width > 5 && bounds.height > 5) {
			const newEnv = {
				id: `env_${state.objects.length + 1}`,
				type: 'env-rect' as const,
				x: bounds.x,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height
			};

			state.objects = [...state.objects, newEnv];
			state.selectedIds = new Set([newEnv.id]);
		}

		state.isRectDrawing = false;
	}
}