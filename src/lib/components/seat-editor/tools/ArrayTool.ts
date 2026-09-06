import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point } from '../types';
import { BOX_SIZE, GAP, GRID_SIZE } from '../constants';

export class ArrayToolStrategy extends BaseToolStrategy {
	readonly id = 'add-array';

	calculateArraySeats(startScreen: Point, endScreen: Point, state: ToolContext['state']): Point[] {
		const p1 = this.screenToCanvas(startScreen, state.panX, state.panY, state.scale);
		const p2 = this.screenToCanvas(endScreen, state.panX, state.panY, state.scale);

		const minX = Math.min(p1.x, p2.x);
		const maxX = Math.max(p1.x, p2.x);
		const minY = Math.min(p1.y, p2.y);
		const maxY = Math.max(p1.y, p2.y);

		const stride = BOX_SIZE + GAP;
		const cols = (maxX - minX) < BOX_SIZE ? 1 : Math.floor((maxX - minX - BOX_SIZE) / stride) + 1;
		const rows = (maxY - minY) < BOX_SIZE ? 1 : Math.floor((maxY - minY - BOX_SIZE) / stride) + 1;

		const arraySeats: Point[] = [];

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const posX = Math.max(0, Math.min(state.gridWidth * GRID_SIZE - BOX_SIZE, minX + c * stride));
				const posY = Math.max(0, Math.min(state.gridHeight * GRID_SIZE - BOX_SIZE, minY + r * stride));

				const overlaps = state.objects.some(
					o => o.type === 'seat' && Math.abs(o.x - posX) < BOX_SIZE && Math.abs(o.y - posY) < BOX_SIZE
				);

				if (!overlaps) {
					arraySeats.push({ x: posX, y: posY });
				}
			}
		}

		return arraySeats;
	}

	override onMouseDown({ state, screenPoint }: ToolContext) {
		state.isArrayDrawing = true;
		state.arrayStart = screenPoint;
		state.arrayEnd = screenPoint;
	}

	override onMouseMove({ state, screenPoint }: ToolContext) {
		if (state.isArrayDrawing) {
			state.arrayEnd = screenPoint;
		}
	}

	override onMouseUp({ state }: ToolContext) {
		if (!state.isArrayDrawing) return;

		const points = this.calculateArraySeats(state.arrayStart, state.arrayEnd, state);
		if (points.length > 0) {
			const batch = points.map((pt, idx) => 
				this.createSeatObject(state.objects.length + idx + 1, pt.x, pt.y)
			);

			state.objects = [...state.objects, ...batch];
			state.selectedIds = new Set(batch.map(b => b.id));
		}

		state.isArrayDrawing = false;
	}
}