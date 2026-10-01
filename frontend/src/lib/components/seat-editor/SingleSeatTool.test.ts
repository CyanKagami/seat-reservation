import { describe, it, expect, beforeEach } from 'vitest';
import { SingleSeatToolStrategy } from './tools/SingleSeatTool';
import { SeatEditorState } from './seatState.svelte';
import type { ToolContext } from './tools/types';
import { BOX_SIZE } from './constants';

describe('SingleSeatToolStrategy', () => {
	let singleSeatTool: SingleSeatToolStrategy;
	let state: SeatEditorState;

	beforeEach(() => {
		singleSeatTool = new SingleSeatToolStrategy();
		state = new SeatEditorState('test-loc');
	});

	it('should add a single seat on mousedown', () => {
		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 50, y: 50 },
			screenPoint: { x: 50, y: 50 }
		} as ToolContext;

		singleSeatTool.onMouseDown(context);

		expect(state.objects.length).toBe(1);
		
		const seat = state.objects[0];
		expect(seat.type).toBe('seat');
		expect(seat.x).toBe(50 - BOX_SIZE / 2);
		expect(seat.y).toBe(50 - BOX_SIZE / 2);
		expect(seat.width).toBe(BOX_SIZE);
		expect(seat.height).toBe(BOX_SIZE);
	});
	
	it('should bound the seat placement to positive coordinates', () => {
		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 5, y: 5 }, // Less than half of BOX_SIZE (10)
			screenPoint: { x: 5, y: 5 }
		} as ToolContext;

		singleSeatTool.onMouseDown(context);

		expect(state.objects.length).toBe(1);
		
		const seat = state.objects[0];
		expect(seat.x).toBe(0);
		expect(seat.y).toBe(0);
	});
	
	it('should select the newly created seat', () => {
		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 50, y: 50 },
			screenPoint: { x: 50, y: 50 }
		} as ToolContext;

		singleSeatTool.onMouseDown(context);

		expect(state.selectedIds.size).toBe(1);
		expect(state.selectedIds.has(state.objects[0].id)).toBe(true);
	});
});
