import { describe, it, expect, beforeEach } from 'vitest';
import { LineToolStrategy } from './tools/LineTool';
import { SeatEditorState } from './seatState.svelte';
import { BOX_SIZE, GAP, GRID_SIZE } from './constants';
import type { ToolContext } from './tools/types';

describe('LineToolStrategy', () => {
	let lineTool: LineToolStrategy;
	let state: SeatEditorState;

	beforeEach(() => {
		lineTool = new LineToolStrategy();
		state = new SeatEditorState('test-loc');
		state.panX = 0;
		state.panY = 0;
		state.scale = 1;
		state.gridWidth = 100;
		state.gridHeight = 100;
	});

	it('should calculate exactly one seat for distance 0', () => {
		const startScreen = { x: 100, y: 100 };
		const endScreen = { x: 100, y: 100 };

		const seats = lineTool.calculateLineSeats(startScreen, endScreen, state);
		expect(seats.length).toBe(1);
		expect(seats[0]).toEqual({ x: 100, y: 100 });
	});

	it('should calculate multiple seats based on distance and stride', () => {
		const stride = BOX_SIZE + GAP;
		const startScreen = { x: 100, y: 100 };
		const endScreen = { x: 100 + stride * 2, y: 100 };

		const seats = lineTool.calculateLineSeats(startScreen, endScreen, state);
		expect(seats.length).toBe(3);
		expect(seats[0]).toEqual({ x: 100, y: 100 });
		expect(seats[1]).toEqual({ x: 100 + stride, y: 100 });
		expect(seats[2]).toEqual({ x: 100 + stride * 2, y: 100 });
	});

	it('should limit seat spawning to grid boundaries', () => {
		const maxX = state.gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = state.gridHeight * GRID_SIZE - BOX_SIZE;
		
		const startScreen = { x: maxX + 100, y: maxY + 100 }; 
		const endScreen = { x: maxX + 200, y: maxY + 200 }; 

		const seats = lineTool.calculateLineSeats(startScreen, endScreen, state);
		
		seats.forEach(seat => {
			expect(seat.x).toBeLessThanOrEqual(maxX);
			expect(seat.y).toBeLessThanOrEqual(maxY);
		});
	});

	it('should initialize line drawing on mousedown', () => {
		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 50, y: 50 },
			screenPoint: { x: 50, y: 50 }
		} as ToolContext;

		lineTool.onMouseDown(context);

		expect(state.isLineDrawing).toBe(true);
		expect(state.lineStart).toEqual({ x: 50, y: 50 });
		expect(state.lineEnd).toEqual({ x: 50, y: 50 });
	});

	it('should append new seats to state on mouseup', () => {
		state.isLineDrawing = true;
		state.lineStart = { x: 100, y: 100 };
		
		const stride = BOX_SIZE + GAP;
		state.lineEnd = { x: 100 + stride, y: 100 };

		const context = {
			state,
			event: {} as MouseEvent,
			canvasPoint: { x: 100 + stride, y: 100 },
			screenPoint: { x: 100 + stride, y: 100 }
		} as ToolContext;

		lineTool.onMouseUp(context);

		expect(state.objects.length).toBe(2);
		expect(state.selectedIds.size).toBe(2);
		expect(state.isLineDrawing).toBe(false);
	});
});
