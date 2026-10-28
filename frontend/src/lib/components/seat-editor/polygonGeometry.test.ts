import { describe, expect, it } from 'vitest';
import { rotatePoint } from '../canvas-shared/utils';
import type { CanvasObject } from './types';
import {
	getPolygonRotationCenter,
	movePolygonVertex,
	snapPolygonVertexToNeighborAxis
} from './polygonGeometry';

function getRenderedVertex(obj: CanvasObject, index: number) {
	const point = obj.points![index];
	const center = getPolygonRotationCenter(obj);
	return rotatePoint(
		obj.x + point.x,
		obj.y + point.y,
		obj.x + center.x,
		obj.y + center.y,
		obj.rotation ?? 0
	);
}

describe('polygon vertex movement', () => {
	it('moves a rotated vertex without shifting the other vertices', () => {
		const polygon: CanvasObject = {
			id: 'polygon_1',
			type: 'env-polygon',
			x: 100,
			y: 100,
			width: 100,
			height: 80,
			rotation: 90,
			points: [
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 0, y: 80 }
			],
			metadata: {}
		};
		const previousVertices = polygon.points!.map((_, index) => getRenderedVertex(polygon, index));
		const target = { x: 180, y: 130 };

		const moved = movePolygonVertex(polygon, 0, target);

		expect(getRenderedVertex(moved, 0).x).toBeCloseTo(target.x);
		expect(getRenderedVertex(moved, 0).y).toBeCloseTo(target.y);
		expect(getRenderedVertex(moved, 1).x).toBeCloseTo(previousVertices[1].x);
		expect(getRenderedVertex(moved, 1).y).toBeCloseTo(previousVertices[1].y);
		expect(getRenderedVertex(moved, 2).x).toBeCloseTo(previousVertices[2].x);
		expect(getRenderedVertex(moved, 2).y).toBeCloseTo(previousVertices[2].y);
	});

	it('snaps to the closest horizontal or vertical axis of another vertex', () => {
		const polygon: CanvasObject = {
			id: 'polygon_2',
			type: 'env-polygon',
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			points: [
				{ x: 10, y: 10 },
				{ x: 50, y: 20 },
				{ x: 80, y: 80 }
			],
			metadata: {}
		};

		expect(snapPolygonVertexToNeighborAxis(polygon, 0, { x: 47, y: 21 }, 5)).toEqual({ x: 47, y: 20 });
		expect(snapPolygonVertexToNeighborAxis(polygon, 0, { x: 49, y: 24 }, 5)).toEqual({ x: 50, y: 24 });
		expect(snapPolygonVertexToNeighborAxis(polygon, 0, { x: 36, y: 45 }, 5)).toEqual({ x: 36, y: 45 });
	});

	it('snaps against the rendered positions of rotated neighbor vertices', () => {
		const polygon: CanvasObject = {
			id: 'polygon_3',
			type: 'env-polygon',
			x: 100,
			y: 100,
			width: 100,
			height: 80,
			rotation: 90,
			points: [
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 0, y: 80 }
			],
			metadata: {}
		};
		const neighbor = getRenderedVertex(polygon, 1);

		expect(
			snapPolygonVertexToNeighborAxis(
				polygon,
				0,
				{ x: neighbor.x + 30, y: neighbor.y + 3 },
				5
			)
		).toEqual({ x: neighbor.x + 30, y: neighbor.y });
	});

	it('snaps to the intersection of axes from two different vertices', () => {
		const polygon: CanvasObject = {
			id: 'polygon_4',
			type: 'env-polygon',
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			points: [
				{ x: 10, y: 10 },
				{ x: 50, y: 10 },
				{ x: 50, y: 50 },
				{ x: 10, y: 50 }
			],
			metadata: {}
		};

		expect(snapPolygonVertexToNeighborAxis(polygon, 0, { x: 49, y: 51 }, 5)).toEqual({ x: 50, y: 50 });
	});

	it('chooses a nearby axis instead of jumping to a distant corner intersection', () => {
		const polygon: CanvasObject = {
			id: 'polygon_5',
			type: 'env-polygon',
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			points: [
				{ x: 10, y: 10 },
				{ x: 50, y: 10 },
				{ x: 50, y: 50 },
				{ x: 10, y: 50 }
			],
			metadata: {}
		};

		expect(
			snapPolygonVertexToNeighborAxis(polygon, 0, { x: 30, y: 68 }, 36, 12)
		).toEqual({ x: 30, y: 50 });
	});
});
