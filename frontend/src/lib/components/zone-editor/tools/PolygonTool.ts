import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import type { Point } from '../types';

export class PolygonToolStrategy extends BaseToolStrategy {
	readonly id = 'add-polygon';
	private readonly SNAP_THRESHOLD_PX = 12; // Screen distance threshold to close polygon

	override onMouseDown({ state, screenPoint, event }: ToolContext) {
		const canvasPt = this.screenToCanvas(screenPoint, state.panX, state.panY, state.scale);

		// 1. First vertex placement
		if (!state.isPolygonDrawing) {
			state.isPolygonDrawing = true;
			state.polygonPoints = [canvasPt];
			state.polygonCursor = screenPoint;
			return;
		}

		// 2. Check if clicking near start point to close polygon
		const startScreenPt = {
			x: state.polygonPoints[0].x * state.scale + state.panX,
			y: state.polygonPoints[0].y * state.scale + state.panY
		};
		const distToStart = Math.hypot(screenPoint.x - startScreenPt.x, screenPoint.y - startScreenPt.y);

		if (state.polygonPoints.length >= 3 && distToStart <= this.SNAP_THRESHOLD_PX) {
			this.finishPolygon(state);
			return;
		}

		// 3. Add point (constrained by Shift if active)
		const lastPt = state.polygonPoints[state.polygonPoints.length - 1];
		let nextCanvasPt = canvasPt;

		if (event.shiftKey) {
			const lastScreenPt = {
				x: lastPt.x * state.scale + state.panX,
				y: lastPt.y * state.scale + state.panY
			};
			const snappedScreenPt = this.snapToAngle(lastScreenPt, screenPoint, 15);
			nextCanvasPt = this.screenToCanvas(snappedScreenPt, state.panX, state.panY, state.scale);
		}

		state.polygonPoints = [...state.polygonPoints, nextCanvasPt];
	}

	override onMouseMove({ state, screenPoint, event }: ToolContext) {
		if (!state.isPolygonDrawing || state.polygonPoints.length === 0) return;

		if (event.shiftKey) {
			const lastPt = state.polygonPoints[state.polygonPoints.length - 1];
			const lastScreenPt = {
				x: lastPt.x * state.scale + state.panX,
				y: lastPt.y * state.scale + state.panY
			};
			state.polygonCursor = this.snapToAngle(lastScreenPt, screenPoint, 15);
		} else {
			state.polygonCursor = screenPoint;
		}
	}

	finishPolygon(state: ToolContext['state']) {
		if (state.polygonPoints.length < 3) {
			this.cancelPolygon(state);
			return;
		}

		// Calculate Bounding Box
		const xs = state.polygonPoints.map((p) => p.x);
		const ys = state.polygonPoints.map((p) => p.y);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);

		const width = maxX - minX;
		const height = maxY - minY;

		if (width > 5 && height > 5) {
			// Normalize points relative to bounding box origin (x, y)
			const relativePoints = state.polygonPoints.map((p) => ({
				x: p.x - minX,
				y: p.y - minY
			}));

			const newPolygon = {
				id: `env_poly_${state.objects.length + 1}`,
				type: 'env-polygon' as const,
				x: minX,
				y: minY,
				width,
				height,
				points: relativePoints
			};

			state.objects = [...state.objects, newPolygon];
			state.selectedIds = new Set([newPolygon.id]);
		}

		this.cancelPolygon(state);
	}

	cancelPolygon(state: ToolContext['state']) {
		state.isPolygonDrawing = false;
		state.polygonPoints = [];
	}
}