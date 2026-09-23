import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point } from '../types';
import { BOX_SIZE, GAP, GRID_SIZE } from '../constants';

export class ArrayToolStrategy extends BaseToolStrategy {
	readonly id = 'add-array';

	calculateArraySeats(startScreen: Point, endScreen: Point, state: ToolContext['state']): Point[] {
		const p1 = this.screenToCanvas(startScreen, state.panX, state.panY, state.scale);
		const p2 = this.screenToCanvas(endScreen, state.panX, state.panY, state.scale);

		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		const stride = BOX_SIZE + GAP;
		const cols = absDx < BOX_SIZE ? 1 : Math.floor((absDx - BOX_SIZE) / stride) + 1;
		const rows = absDy < BOX_SIZE ? 1 : Math.floor((absDy - BOX_SIZE) / stride) + 1;

		const maxX = state.gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = state.gridHeight * GRID_SIZE - BOX_SIZE;

		const arraySeats: Point[] = [];

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				// Spawn relative to the starting point p1
				const rawX = dx >= 0 ? p1.x + c * stride : p1.x - BOX_SIZE - c * stride;
				const rawY = dy >= 0 ? p1.y + r * stride : p1.y - BOX_SIZE - r * stride;

				const posX = Math.max(0, Math.min(maxX, rawX));
				const posY = Math.max(0, Math.min(maxY, rawY));

				const overlapsExisting = state.objects.some(
					(o) => o.type === 'seat' && Math.abs(o.x - posX) < BOX_SIZE && Math.abs(o.y - posY) < BOX_SIZE
				);
				const overlapsBatch = arraySeats.some(
					(s) => Math.abs(s.x - posX) < BOX_SIZE && Math.abs(s.y - posY) < BOX_SIZE
				);

				if (!overlapsExisting && !overlapsBatch) {
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