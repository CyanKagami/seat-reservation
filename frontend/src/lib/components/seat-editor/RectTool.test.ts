import { describe, it, expect, beforeEach } from 'vitest';
import { RectToolStrategy } from './tools/RectTool';
import type { ToolContext } from './tools/types';

describe('RectToolStrategy', () => {
	let tool: RectToolStrategy;
	let mockState: ToolContext['state'];

	beforeEach(() => {
		tool = new RectToolStrategy();
		mockState = {
			panX: 0,
			panY: 0,
			scale: 1,
		} as unknown as ToolContext['state'];
	});

	it('calculates rect bounds without shift key (free aspect ratio)', () => {
		const start = { x: 10, y: 10 };
		const end = { x: 40, y: 30 }; // dx = 30, dy = 20

		const bounds = tool.calculateRectBounds(start, end, false, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 30,
			height: 20
		});
	});

	it('calculates rect bounds in reverse direction without shift key', () => {
		const start = { x: 40, y: 30 };
		const end = { x: 10, y: 10 }; // dx = -30, dy = -20

		const bounds = tool.calculateRectBounds(start, end, false, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 30,
			height: 20
		});
	});

	it('calculates rect bounds with shift key (1:1 ratio)', () => {
		const start = { x: 10, y: 10 };
		const end = { x: 40, y: 30 }; // dx = 30, dy = 20

		const bounds = tool.calculateRectBounds(start, end, true, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 30,
			height: 30
		});
	});

	it('calculates rect bounds with shift key in reverse direction', () => {
		const start = { x: 50, y: 50 };
		const end = { x: 10, y: 30 }; // dx = -40, dy = -20

		const bounds = tool.calculateRectBounds(start, end, true, mockState);

		expect(bounds).toEqual({
			x: 10,
			y: 10,
			width: 40,
			height: 40
		});
	});
});
