import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import { polygonsIntersect, rotatePoint } from '../../canvas-shared/utils';

export class LassoToolStrategy extends BaseToolStrategy {
	readonly id = 'lasso';

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
			const center = { x: o.x + o.width / 2, y: o.y + o.height / 2 };
			const corners = [
				{ x: o.x, y: o.y },
				{ x: o.x + o.width, y: o.y },
				{ x: o.x + o.width, y: o.y + o.height },
				{ x: o.x, y: o.y + o.height }
			].map((point) => rotatePoint(point.x, point.y, center.x, center.y, o.rotation ?? 0));
			if (polygonsIntersect(corners, polyCanvas)) {
				nextSelected.add(o.id);
			}
		});

		state.selectedIds = nextSelected;
		state.isLassoSelecting = false;
		state.lassoPoints = [];
	}
}