import { describe, it, expect, beforeEach } from 'vitest';
import { PointerToolStrategy } from './tools/PointerTool';
import { SeatEditorState } from './seatState.svelte';
import type { ToolContext } from './tools/types';

describe('PointerToolStrategy', () => {
	let pointerTool: PointerToolStrategy;
	let state: SeatEditorState;

	beforeEach(() => {
		pointerTool = new PointerToolStrategy();
		state = new SeatEditorState('test-loc');
		state.panX = 0;
		state.panY = 0;
		state.scale = 1;
		
		state.objects = [
			{ id: 'seat_1', type: 'seat', x: 10, y: 10, width: 20, height: 20, metadata: {} as any },
			{ id: 'seat_2', type: 'seat', x: 50, y: 50, width: 20, height: 20, metadata: {} as any },
			{ id: 'seat_3', type: 'seat', x: 100, y: 100, width: 20, height: 20, metadata: {} as any }
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

		pointerTool.onMouseDown(context);
		
		expect(state.selectedIds.size).toBe(0);
		expect(state.isBoxSelecting).toBe(true);
		expect(state.boxStart).toEqual({ x: 0, y: 0 });
	});

	it('should update boxEnd on mousemove if box selecting', () => {
		state.isBoxSelecting = true;
		
		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 10, y: 10 },
			screenPoint: { x: 10, y: 10 }
		} as ToolContext;

		pointerTool.onMouseMove(context);
		
		expect(state.boxEnd).toEqual({ x: 10, y: 10 });
	});

	it('should select objects within the bounding box on mouseup', () => {
		state.isBoxSelecting = true;
		state.boxStart = { x: 0, y: 0 };
		state.boxEnd = { x: 40, y: 40 };

		const context = {
			state,
			event: { shiftKey: false, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 40, y: 40 },
			screenPoint: { x: 40, y: 40 }
		} as ToolContext;

		pointerTool.onMouseUp(context);

		expect(state.selectedIds.size).toBe(1);
		expect(state.selectedIds.has('seat_1')).toBe(true);
		expect(state.isBoxSelecting).toBe(false);
	});
	
	it('should handle scaled and panned coordinates', () => {
		state.panX = 10;
		state.panY = 10;
		state.scale = 2;
		
		state.isBoxSelecting = true;
		// Screen coordinates that translate to canvas (0, 0) and (40, 40)
		state.boxStart = { x: 10, y: 10 };
		state.boxEnd = { x: 90, y: 90 };
		
		const context = {
			state,
			event: { shiftKey: false, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 40, y: 40 },
			screenPoint: { x: 90, y: 90 }
		} as ToolContext;

		pointerTool.onMouseUp(context);

		expect(state.selectedIds.size).toBe(1);
		expect(state.selectedIds.has('seat_1')).toBe(true);
	});

	it('should append to selection when modifier key is held', () => {
		state.selectedIds = new Set(['seat_3']);
		state.isBoxSelecting = true;
		state.boxStart = { x: 0, y: 0 };
		state.boxEnd = { x: 40, y: 40 };

		const context = {
			state,
			event: { shiftKey: true, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 40, y: 40 },
			screenPoint: { x: 40, y: 40 }
		} as ToolContext;

		pointerTool.onMouseUp(context);

		expect(state.selectedIds.size).toBe(2);
		expect(state.selectedIds.has('seat_1')).toBe(true);
		expect(state.selectedIds.has('seat_3')).toBe(true);
	});
	
	it('should not change selection if drag distance is <= 2', () => {
		state.isBoxSelecting = true;
		state.boxStart = { x: 10, y: 10 };
		state.boxEnd = { x: 11, y: 11 }; // distance is ~1.41

		const context = {
			state,
			event: { shiftKey: false, metaKey: false, ctrlKey: false } as unknown as MouseEvent,
			canvasPoint: { x: 11, y: 11 },
			screenPoint: { x: 11, y: 11 }
		} as ToolContext;

		pointerTool.onMouseUp(context);

		expect(state.selectedIds.size).toBe(0); 
		expect(state.isBoxSelecting).toBe(false);
	});
});
