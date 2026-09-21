import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point } from '../types';
import { BOX_SIZE, GAP, GRID_SIZE } from '../constants';

export class LineToolStrategy extends BaseToolStrategy {
	readonly id = 'add-line';

	// Tool-specific math encapsulated inside strategy
	calculateLineSeats(startScreen: Point, endScreen: Point, state: ToolContext['state']): Point[] {
		const start = this.screenToCanvas(startScreen, state.panX, state.panY, state.scale);
		const end = this.screenToCanvas(endScreen, state.panX, state.panY, state.scale);

		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const distance = Math.hypot(dx, dy);

		const maxX = state.gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = state.gridHeight * GRID_SIZE - BOX_SIZE;

		if (distance === 0) {
			return [{ x: Math.max(0, Math.min(maxX, start.x)), y: Math.max(0, Math.min(maxY, start.y)) }];
		}

		const stride = BOX_SIZE + GAP;
		const seatCount = Math.floor(distance / stride);
		const ux = dx / distance;
		const uy = dy / distance;

		const lineSeats: Point[] = [];
		for (let i = 0; i <= seatCount; i++) {
			const posX = Math.max(0, Math.min(maxX, start.x + ux * i * stride));
			const posY = Math.max(0, Math.min(maxY, start.y + uy * i * stride));
			lineSeats.push({ x: posX, y: posY });
		}

		return lineSeats;
	}

	override onMouseDown({ state, screenPoint }: ToolContext) {
		state.isLineDrawing = true;
		state.lineStart = screenPoint;
		state.lineEnd = screenPoint;
	}

	override onMouseMove({ state, screenPoint, event }: ToolContext) {
		if (!state.isLineDrawing) return;
		state.lineEnd = event.shiftKey 
			? this.snapToAngle(state.lineStart, screenPoint, 15) 
			: screenPoint;
	}

	override onMouseUp({ state }: ToolContext) {
		if (!state.isLineDrawing) return;

		const points = this.calculateLineSeats(state.lineStart, state.lineEnd, state);
		if (points.length > 0) {
			const newBatch = points.map((pt, idx) => 
				this.createSeatObject(state.objects.length + idx + 1, pt.x, pt.y)
			);

			state.objects = [...state.objects, ...newBatch];
			state.selectedIds = new Set(newBatch.map(b => b.id));
		}

		state.isLineDrawing = false;
	}
}