import { describe, it, expect, beforeEach } from 'vitest';
import { CircleToolStrategy } from './tools/CircleTool';
import type { ToolContext } from './tools/types';
import { GRID_SIZE } from './constants';

describe('CircleToolStrategy', () => {
	let tool: CircleToolStrategy;
	let mockState: ToolContext['state'];

	beforeEach(() => {
		tool = new CircleToolStrategy();
		mockState = {
			panX: 0,
			panY: 0,
			scale: 1,
			gridWidth: 10,
			gridHeight: 10,
		} as unknown as ToolContext['state'];
	});

	it('calculates circle bounds without shift key (free aspect ratio)', () => {
		const start = { x: 10, y: 10 };
		const end = { x: 40, y: 30 };

		const bounds = tool.calculateCircleBounds(start, end, false, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 30,
			height: 20
		});
	});

	it('calculates circle bounds in reverse direction without shift key', () => {
		const start = { x: 40, y: 30 };
		const end = { x: 10, y: 10 };

		const bounds = tool.calculateCircleBounds(start, end, false, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 30,
			height: 20
		});
	});

	it('calculates circle bounds with shift key (1:1 ratio)', () => {
		const start = { x: 10, y: 10 };
		const end = { x: 40, y: 30 };

		const bounds = tool.calculateCircleBounds(start, end, true, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 30,
			height: 30
		});
	});

	it('calculates circle bounds with shift key in reverse direction', () => {
		const start = { x: 50, y: 50 };
		const end = { x: 10, y: 30 };

		const bounds = tool.calculateCircleBounds(start, end, true, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 40,
			height: 40
		});
	});

	it('clamps a drag endpoint released outside the canvas to the edge', () => {
		const bounds = tool.calculateCircleBounds(
			{ x: 90, y: 80 },
			{ x: 150, y: 140 },
			false,
			mockState
		);

		expect(bounds).toEqual({
			x: 90,
			y: 80,
			width: GRID_SIZE,
			height: GRID_SIZE * 2
		});
	});

	it('keeps a shift-constrained circle inside the canvas near an edge', () => {
		const bounds = tool.calculateCircleBounds(
			{ x: 90, y: 80 },
			{ x: 150, y: 140 },
			true,
			mockState
		);

		expect(bounds).toEqual({
			x: 90,
			y: 80,
			width: GRID_SIZE,
			height: GRID_SIZE
		});
	});

	it('uses the release position when it is outside the canvas', () => {
		Object.assign(mockState, {
			isCircleDrawing: true,
			circleStart: { x: 90, y: 80 },
			circleEnd: { x: 95, y: 85 },
			objects: [],
			selectedIds: new Set(),
			createObjectId: () => 'env_circle_1'
		});

		tool.onMouseUp({
			state: mockState,
			event: { shiftKey: false } as MouseEvent,
			screenPoint: { x: 150, y: 140 },
			canvasPoint: { x: 150, y: 140 }
		});

		expect(mockState.objects[0]).toMatchObject({
			x: 90,
			y: 80,
			width: GRID_SIZE,
			height: GRID_SIZE * 2
		});
	});
});
