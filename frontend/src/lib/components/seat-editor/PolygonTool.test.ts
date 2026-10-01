import { describe, it, expect, beforeEach } from 'vitest';
import { PolygonToolStrategy } from './tools/PolygonTool';
import type { ToolContext } from './tools/types';

describe('PolygonToolStrategy', () => {
	let tool: PolygonToolStrategy;
	let mockState: ToolContext['state'];

	beforeEach(() => {
		tool = new PolygonToolStrategy();
		mockState = {
			objects: [],
			selectedIds: new Set(),
			isPolygonDrawing: true,
			polygonPoints: [],
		} as unknown as ToolContext['state'];
	});

	it('cancels polygon if less than 3 points', () => {
		mockState.polygonPoints = [
			{ x: 10, y: 10 },
			{ x: 20, y: 20 }
		];

		tool.finishPolygon(mockState);

		expect(mockState.isPolygonDrawing).toBe(false);
		expect(mockState.polygonPoints).toEqual([]);
		expect(mockState.objects).toEqual([]);
	});

	it('finishes polygon, calculates bounds, normalizes points and creates object', () => {
		mockState.polygonPoints = [
			{ x: 10, y: 10 },
			{ x: 50, y: 10 },
			{ x: 30, y: 50 }
		];
		
		tool.finishPolygon(mockState);

		expect(mockState.objects).toHaveLength(1);
		const newPoly = mockState.objects[0];
		
		expect(newPoly.type).toBe('env-polygon');
		expect(newPoly.x).toBe(10);
		expect(newPoly.y).toBe(10);
		expect(newPoly.width).toBe(40);
		expect(newPoly.height).toBe(40);
		
		// Points should be normalized relative to bounding box minX/minY (10, 10)
		expect(newPoly.points).toEqual([
			{ x: 0, y: 0 },
			{ x: 40, y: 0 },
			{ x: 20, y: 40 }
		]);

		expect(mockState.isPolygonDrawing).toBe(false);
		expect(mockState.polygonPoints).toEqual([]);
		expect(mockState.selectedIds.has(newPoly.id)).toBe(true);
	});

	it('does not create polygon if bounding box is too small', () => {
		mockState.polygonPoints = [
			{ x: 10, y: 10 },
			{ x: 12, y: 10 },
			{ x: 11, y: 12 }
		];

		tool.finishPolygon(mockState);

		expect(mockState.objects).toEqual([]);
		expect(mockState.isPolygonDrawing).toBe(false);
		expect(mockState.polygonPoints).toEqual([]);
	});
});
