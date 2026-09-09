import type { ToolType, Point } from '../types';
import type { ToolContext } from './types';
import { BOX_SIZE } from '../constants';

export abstract class BaseToolStrategy {
	abstract readonly id: ToolType;

	// Default lifecycle implementations (subclasses only override what they need)
	onMouseDown(_ctx: ToolContext): void {}
	onMouseMove(_ctx: ToolContext): void {}
	onMouseUp(_ctx: ToolContext): void {}

	// --- Shared Geometric & Object Utilities ---

	protected snapToAngle(start: Point, end: Point, stepDegrees: number = 15): Point {
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const distance = Math.hypot(dx, dy);

		if (distance === 0) return end;

		const angle = Math.atan2(dy, dx);
		const stepRadians = (stepDegrees * Math.PI) / 180;
		const snappedAngle = Math.round(angle / stepRadians) * stepRadians;

		return {
			x: start.x + distance * Math.cos(snappedAngle),
			y: start.y + distance * Math.sin(snappedAngle)
		};
	}

	protected screenToCanvas(screenPt: Point, panX: number, panY: number, scale: number): Point {
		return {
			x: (screenPt.x - panX) / scale,
			y: (screenPt.y - panY) / scale
		};
	}

	protected createSeatObject(id: number, x: number, y: number) {
		return {
			id: `seat_${id}`,
			type: 'seat' as const,
			x,
			y,
			width: BOX_SIZE,
			height: BOX_SIZE,
			metadata: {}
		};
	}
}