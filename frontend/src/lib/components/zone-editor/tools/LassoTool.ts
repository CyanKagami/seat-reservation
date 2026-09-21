import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point } from '../types';

export class LassoToolStrategy extends BaseToolStrategy {
	readonly id = 'lasso';

	private pointInPolygon(point: Point, polygon: Point[]): boolean {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].x, yi = polygon[i].y;
			const xj = polygon[j].x, yj = polygon[j].y;
			const intersect =
				yi > point.y !== yj > point.y &&
				point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}
		return inside;
	}

	override onMouseDown({ state, screenPoint, event }: ToolContext) {
		state.isLassoSelecting = true;
		state.lassoPoints = [screenPoint];

		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;
		if (!hasModifier) {
			state.selectedIds = new Set();
		}
	}

	override onMouseMove({ state, screenPoint }: ToolContext) {
		if (state.isLassoSelecting) {
			state.lassoPoints = [...state.lassoPoints, screenPoint];
		}
	}

	override onMouseUp({ state, event }: ToolContext) {
		if (!state.isLassoSelecting || state.lassoPoints.length < 3) {
			state.isLassoSelecting = false;
			state.lassoPoints = [];
			return;
		}

		const polyCanvas = state.lassoPoints.map((p) =>
			this.screenToCanvas(p, state.panX, state.panY, state.scale)
		);

		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;
		const nextSelected = new Set(hasModifier ? state.selectedIds : []);

		state.objects.forEach((o) => {
			if (o.type !== 'seat' || (o.metadata && o.metadata.status === 'unavailable')) return;
			const center = { x: o.x + o.width / 2, y: o.y + o.height / 2 };
			if (this.pointInPolygon(center, polyCanvas)) {
				nextSelected.add(o.id);
			}
		});

		state.selectedIds = nextSelected;
		state.isLassoSelecting = false;
		state.lassoPoints = [];
	}
}