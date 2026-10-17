import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';

export class PointerToolStrategy extends BaseToolStrategy {
	readonly id = 'pointer';

	override onMouseDown({ state, screenPoint, event }: ToolContext) {
		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;
		if (!hasModifier) {
			state.selectedIds = new Set();
		}

		state.isBoxSelecting = true;
		state.boxStart = screenPoint;
		state.boxEnd = screenPoint;
	}

	override onMouseMove({ state, screenPoint }: ToolContext) {
		if (state.isBoxSelecting) {
			state.boxEnd = screenPoint;
		}
	}

	override onMouseUp({ state, event }: ToolContext) {
		if (!state.isBoxSelecting) return;

		const dragDistance = Math.hypot(state.boxEnd.x - state.boxStart.x, state.boxEnd.y - state.boxStart.y);
		if (dragDistance > 2) {
			const x1 = (Math.min(state.boxStart.x, state.boxEnd.x) - state.panX) / state.scale;
			const y1 = (Math.min(state.boxStart.y, state.boxEnd.y) - state.panY) / state.scale;
			const x2 = (Math.max(state.boxStart.x, state.boxEnd.x) - state.panX) / state.scale;
			const y2 = (Math.max(state.boxStart.y, state.boxEnd.y) - state.panY) / state.scale;

			const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;
			const nextSelected = new Set(hasModifier ? state.selectedIds : []);

			state.objects.forEach((o) => {
				if (o.type !== 'seat' || (o.metadata && o.metadata.status === 'unavailable')) return;
				const intersects = o.x < x2 && o.x + o.width > x1 && o.y < y2 && o.y + o.height > y1;
				if (intersects) nextSelected.add(o.id);
			});

			state.selectedIds = nextSelected;
		}

		state.isBoxSelecting = false;
	}
}