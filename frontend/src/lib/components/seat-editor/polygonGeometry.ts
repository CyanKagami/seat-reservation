import { rotatePoint } from '../canvas-shared/utils';
import type { CanvasObject, Point } from './types';

export function getPolygonRotationCenter(obj: Pick<CanvasObject, 'points' | 'rotationCenter'>): Point {
	if (obj.rotationCenter) return obj.rotationCenter;
	const points = obj.points ?? [];
	if (points.length === 0) return { x: 0, y: 0 };

	return {
		x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
		y: points.reduce((sum, point) => sum + point.y, 0) / points.length
	};
}

export function movePolygonVertex(obj: CanvasObject, index: number, worldPoint: Point): CanvasObject {
	if (!obj.points || index < 0 || index >= obj.points.length) return obj;

	const rotationCenter = getPolygonRotationCenter(obj);
	const unrotatedPoint = rotatePoint(
		worldPoint.x,
		worldPoint.y,
		obj.x + rotationCenter.x,
		obj.y + rotationCenter.y,
		-(obj.rotation ?? 0)
	);
	const points = [...obj.points];
	points[index] = { x: unrotatedPoint.x - obj.x, y: unrotatedPoint.y - obj.y };

	return { ...obj, points, rotationCenter };
}

export function snapPolygonVertexToNeighborAxis(
	obj: CanvasObject,
	index: number,
	worldPoint: Point,
	threshold: number,
	intersectionThreshold = threshold
): Point {
	if (
		!obj.points ||
		index < 0 ||
		index >= obj.points.length ||
		threshold <= 0 ||
		intersectionThreshold <= 0
	) return worldPoint;

	const center = getPolygonRotationCenter(obj);
	const angle = obj.rotation ?? 0;
	const neighbors: Point[] = [];

	for (const [vertexIndex, point] of obj.points.entries()) {
		if (vertexIndex === index) continue;
		neighbors.push(rotatePoint(
			obj.x + point.x,
			obj.y + point.y,
			obj.x + center.x,
			obj.y + center.y,
			angle
		));
	}

	let nearestIntersection: { point: Point; distance: number } | null = null;
	for (let first = 0; first < neighbors.length; first++) {
		for (let second = first + 1; second < neighbors.length; second++) {
			const point = { x: neighbors[first].x, y: neighbors[second].y };
			const dx = Math.abs(worldPoint.x - point.x);
			const dy = Math.abs(worldPoint.y - point.y);
			if (dx > intersectionThreshold || dy > intersectionThreshold) continue;

			const distance = Math.hypot(dx, dy);
			if (!nearestIntersection || distance < nearestIntersection.distance) {
				nearestIntersection = { point, distance };
			}

			const alternatePoint = { x: neighbors[second].x, y: neighbors[first].y };
			const alternateDx = Math.abs(worldPoint.x - alternatePoint.x);
			const alternateDy = Math.abs(worldPoint.y - alternatePoint.y);
			if (alternateDx <= intersectionThreshold && alternateDy <= intersectionThreshold) {
				const alternateDistance = Math.hypot(alternateDx, alternateDy);
				if (!nearestIntersection || alternateDistance < nearestIntersection.distance) {
					nearestIntersection = { point: alternatePoint, distance: alternateDistance };
				}
			}
		}
	}

	if (nearestIntersection) return nearestIntersection.point;

	let nearestAxis: { point: Point; distance: number } | null = null;
	for (const neighbor of neighbors) {
		for (const candidate of [
			{ point: { x: worldPoint.x, y: neighbor.y }, distance: Math.abs(worldPoint.y - neighbor.y) },
			{ point: { x: neighbor.x, y: worldPoint.y }, distance: Math.abs(worldPoint.x - neighbor.x) }
		]) {
			if (candidate.distance <= threshold && (!nearestAxis || candidate.distance < nearestAxis.distance)) {
				nearestAxis = candidate;
			}
		}
	}

	return nearestAxis?.point ?? worldPoint;
}
