import { describe, expect, it } from 'vitest';
import { ZoneEditorState } from '../zoneState.svelte';
import { LassoToolStrategy } from './LassoTool';
import type { ToolContext } from './types';

describe('ZoneEditor LassoToolStrategy', () => {
	it('selects a seat when the lasso overlaps its edge without crossing its center', () => {
		const state = new ZoneEditorState('location', 'event');
		state.objects = [
			{ id: 'seat_1', type: 'seat', x: 20, y: 20, width: 20, height: 20, metadata: {} }
		];
		state.isLassoSelecting = true;
		state.lassoPoints = [
			{ x: 15, y: 25 },
			{ x: 25, y: 25 },
			{ x: 25, y: 35 },
			{ x: 15, y: 35 }
		];

		new LassoToolStrategy().onMouseUp({
			state,
			event: { shiftKey: false, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 15, y: 35 },
			screenPoint: { x: 15, y: 35 }
		} as ToolContext);

		expect(state.selectedIds.has('seat_1')).toBe(true);
	});
});
