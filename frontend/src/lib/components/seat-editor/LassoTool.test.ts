import { describe, it, expect, beforeEach } from 'vitest';
import { LassoToolStrategy } from './tools/LassoTool';
import { SeatEditorState } from './seatState.svelte';
import type { ToolContext } from './tools/types';

describe('LassoToolStrategy', () => {
	let lassoTool: LassoToolStrategy;
	let state: SeatEditorState;

	beforeEach(() => {
		lassoTool = new LassoToolStrategy();
		state = new SeatEditorState('test-loc');
		state.panX = 0;
		state.panY = 0;
		state.scale = 1;
		
		state.objects = [
			{ id: 'seat_1', type: 'seat', x: 20, y: 20, width: 20, height: 20, metadata: {} as any },
			{ id: 'seat_2', type: 'seat', x: 80, y: 80, width: 20, height: 20, metadata: {} as any }
		];
	});

	it('should clear selection on mousedown without modifiers', () => {
		state.selectedIds = new Set(['seat_1']);
		
		const context = {
			state,
			event: { shiftKey: false, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 0, y: 0 },
			screenPoint: { x: 0, y: 0 }
		} as ToolContext;

		lassoTool.onMouseDown(context);
		
		expect(state.selectedIds.size).toBe(0);
		expect(state.isLassoSelecting).toBe(true);
		expect(state.lassoPoints.length).toBe(1);
	});

	it('should collect points on mousemove', () => {
		state.isLassoSelecting = true;
		state.lassoPoints = [{ x: 0, y: 0 }];
		
		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 10, y: 10 },
			screenPoint: { x: 10, y: 10 }
		} as ToolContext;

		lassoTool.onMouseMove(context);
		
		expect(state.lassoPoints.length).toBe(2);
		expect(state.lassoPoints[1]).toEqual({ x: 10, y: 10 });
	});

	it('should select objects whose center is inside the lasso polygon on mouseup', () => {
		state.isLassoSelecting = true;
		// A lasso that bounds (30, 30) which is center of seat_1 (20,20 + 10,10)
		state.lassoPoints = [
			{ x: 10, y: 10 },
			{ x: 50, y: 10 },
			{ x: 50, y: 50 },
			{ x: 10, y: 50 }
		];

		const context = {
			state,
			event: { shiftKey: false, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 10, y: 50 },
			screenPoint: { x: 10, y: 50 }
		} as ToolContext;

		lassoTool.onMouseUp(context);

		expect(state.selectedIds.size).toBe(1);
		expect(state.selectedIds.has('seat_1')).toBe(true);
		expect(state.isLassoSelecting).toBe(false);
	});
});
