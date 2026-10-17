import { describe, it, expect, beforeEach } from 'vitest';
import { CircleToolStrategy } from './tools/CircleTool';
import type { ToolContext } from './tools/types';

describe('CircleToolStrategy', () => {
	let tool: CircleToolStrategy;
	let mockState: ToolContext['state'];

	beforeEach(() => {
		tool = new CircleToolStrategy();
		mockState = {
			panX: 0,
			panY: 0,
			scale: 1,
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
});
