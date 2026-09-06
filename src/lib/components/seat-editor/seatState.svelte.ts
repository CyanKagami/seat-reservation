import { untrack } from "svelte";
import { BOX_SIZE, GRID_SIZE, MIN_SCALE, MAX_SCALE, GAP } from "./constants";
import type { Point, Rect, ToolType, CanvasObject } from "./types";
import { toolRegistry } from "./tools";
import type { LineToolStrategy } from "./tools/LineTool";
import type { ArrayToolStrategy } from "./tools/ArrayTool";
import type { CircleToolStrategy } from "./tools/CircleTool";
import type { RectToolStrategy } from "./tools/RectTool";
import type { PolygonToolStrategy } from "./tools/PolygonTool";

export class SeatEditorState {
	locationId = $state("v_123");
	gridWidth = $state(80);
	gridHeight = $state(60);

	// Canvas & Active Tool State
	objects = $state<CanvasObject[]>([]);
	copiedObjects = $state<CanvasObject[]>([]);
	selectedIds = $state<Set<string>>(new Set());
	activeTool = $state<ToolType>('pointer');
	canvasElement = $state<HTMLDivElement | null>(null);

	// Viewport State
	panX = $state(0);
	panY = $state(0);
	scale = $state(1);

	// Interaction Flags & Points
	isPanning = $state(false);
	panStart = $state<Point>({ x: 0, y: 0 });

	isDragging = $state(false);
	dragStart = $state<Point>({ x: 0, y: 0 });
	initialPositions = new Map<string, Point>();

	isRotating = $state(false);
	rotateStartAngle = $state(0);
	rotateCenter = $state<Point>({ x: 0, y: 0 });
	initialStates = new Map<string, { x: number; y: number; rotation: number }>();

	isBoxSelecting = $state(false);
	boxStart = $state<Point>({ x: 0, y: 0 });
	boxEnd = $state<Point>({ x: 0, y: 0 });

	isLassoSelecting = $state(false);
	lassoPoints = $state<Point[]>([]);

	isLineDrawing = $state(false);
	lineStart = $state<Point>({ x: 0, y: 0 });
	lineEnd = $state<Point>({ x: 0, y: 0 });

	isArrayDrawing = $state(false);
	arrayStart = $state<Point>({ x: 0, y: 0 });
	arrayEnd = $state<Point>({ x: 0, y: 0 });

	isRectDrawing = $state(false);
	rectStart = $state<Point>({ x: 0, y: 0 });
	rectEnd = $state<Point>({ x: 0, y: 0 });

	isCircleDrawing = $state(false);
	circleStart = $state<Point>({ x: 0, y: 0 });
	circleEnd = $state<Point>({ x: 0, y: 0 });
	isShiftPressed = $state(false);

	constructor(locationId:string) {
		this.locationId = locationId;
	}

	private rafPending = false;

	// Call strategy calculation directly inside reactivity derivations
	previewLineSeats = $derived.by<Point[]>(() => {
		if (!this.isLineDrawing) return [];
		const lineTool = toolRegistry['add-line'] as LineToolStrategy;
		return lineTool.calculateLineSeats(this.lineStart, this.lineEnd, this);
	});

	previewArraySeats = $derived.by<Point[]>(() => {
		if (!this.isArrayDrawing) return [];
		const arrayTool = toolRegistry['add-array'] as ArrayToolStrategy;
		return arrayTool.calculateArraySeats(this.arrayStart, this.arrayEnd, this);
	});

	// Live unscaled rectangle bounds derived during mouse drag
	previewRect = $derived.by<Rect | null>(() => {
		if (!this.isRectDrawing) return null;
		const rectTool = toolRegistry['add-rect'] as RectToolStrategy;
		return rectTool.calculateRectBounds(
			this.rectStart,
			this.rectEnd,
			this.isShiftPressed,
			this
		);
	});

	// --- Add to Derived Properties ---
	previewCircle = $derived.by<Rect | null>(() => {
		if (!this.isCircleDrawing) return null;
		const circleTool = toolRegistry['add-circle'] as CircleToolStrategy;
		return circleTool.calculateCircleBounds(
			this.circleStart,
			this.circleEnd,
			this.isShiftPressed,
			this
		);
	});

	// --- Add State Fields ---
	isPolygonDrawing = $state(false);
	polygonPoints = $state<Point[]>([]);
	polygonCursor = $state<Point>({ x: 0, y: 0 });

	// --- Add Derived Preview String ---
	previewPolygonSvgPoints = $derived.by<string>(() => {
		if (!this.isPolygonDrawing || this.polygonPoints.length === 0) return '';

		// Render existing placed points in screen coordinates
		const pointsStr = this.polygonPoints
			.map((p) => `${p.x * this.scale + this.panX},${p.y * this.scale + this.panY}`)
			.join(' ');

		// Append active cursor position
		return `${pointsStr} ${this.polygonCursor.x},${this.polygonCursor.y}`;
	});

	marqueeRect = $derived.by<Rect | null>(() => {
		if (!this.isBoxSelecting) return null;
		const x = Math.min(this.boxStart.x, this.boxEnd.x);
		const y = Math.min(this.boxStart.y, this.boxEnd.y);
		const width = Math.abs(this.boxStart.x - this.boxEnd.x);
		const height = Math.abs(this.boxStart.y - this.boxEnd.y);
		return { x, y, width, height };
	});

	lassoSvgPoints = $derived.by<string>(() => {
		if (this.lassoPoints.length < 2) return "";
		return this.lassoPoints.map(p => `${p.x},${p.y}`).join(" ");
	});

	overlappingIds = $derived.by<Set<string>>(() => {
		const seats = this.objects.filter((o) => o.type === 'seat');
		const cellSize = BOX_SIZE;
		const cellOf = (v: number) => Math.floor(v / cellSize);

		const buckets = new Map<string, CanvasObject[]>();

		for (const s of seats) {
			if (!s.width || !s.height) continue;
			const minX = cellOf(s.x);
			const maxX = cellOf(s.x + s.width - 0.001);
			const minY = cellOf(s.y);
			const maxY = cellOf(s.y + s.height - 0.001);

			for (let cx = minX; cx <= maxX; cx++) {
				for (let cy = minY; cy <= maxY; cy++) {
					const key = `${cx},${cy}`;
					let bucket = buckets.get(key);
					if (!bucket) {
						bucket = [];
						buckets.set(key, bucket);
					}
					bucket.push(s);
				}
			}
		}

		const overlaps = new Set<string>();

		for (const bucket of buckets.values()) {
			if (bucket.length < 2) continue;
			for (let i = 0; i < bucket.length; i++) {
				for (let j = i + 1; j < bucket.length; j++) {
					const a = bucket[i];
					const b = bucket[j];
					if (a.id === b.id) continue;

					if (Math.abs(a.x - b.x) < BOX_SIZE && Math.abs(a.y - b.y) < BOX_SIZE) {
						overlaps.add(a.id);
						overlaps.add(b.id);
					}
				}
			}
		}

		return overlaps;
	});

	moveSquareOnOutOfBound(gridWidth: number, gridHeight: number) {
		const maxX = gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = gridHeight * GRID_SIZE - BOX_SIZE;
		this.objects = untrack(() =>
			this.objects.map(o => {
				if (o.type === 'seat') {
					const s = o;
					if (s.x > maxX || s.y > maxY) {
						return {
							...s,
							x: Math.max(0, Math.min(maxX, s.x)),
							y: Math.max(0, Math.min(maxY, s.y))
						} as CanvasObject;
					}
				}
				return o;
			})
		);
	}

	isPointInPolygon(point: Point, polygon: Point[]): boolean {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].x, yi = polygon[i].y;
			const xj = polygon[j].x, yj = polygon[j].y;
			const intersect = ((yi > point.y) !== (yj > point.y)) &&
				(point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}
		return inside;
	}

	centerGrid = () => {
		if (!this.canvasElement) return;
		this.panX = (this.canvasElement.clientWidth - this.gridWidth * GRID_SIZE * this.scale) / 2;
		this.panY = (this.canvasElement.clientHeight - this.gridHeight * GRID_SIZE * this.scale) / 2;
	};

	zoomIn = () => {
		this.scale = Math.min(MAX_SCALE, this.scale + 0.1);
	};

	zoomOut = () => {
		this.scale = Math.max(MIN_SCALE, this.scale - 0.1);
	};

	resetZoom = () => {
		this.scale = 1.0;
		this.centerGrid();
	};

	handleSaveButtonClick = (event:MouseEvent) => {
		this.saveToFile(`${this.locationId}_seating-layout.json`)
	}

	exportToJSON(): string {
		const layoutPayload = {
			version: "1.0",
			timestamp: new Date().toISOString(),
			canvas: {
				gridWidth: this.gridWidth,
				gridHeight: this.gridHeight,
			},
			// Strip Svelte 5 reactive proxy wrappers using $state.snapshot
			objects: $state.snapshot(this.objects)
		};

		return JSON.stringify(layoutPayload, null, 2);
	}

	saveToFile(filename = "seating-layout.json") {
		const jsonString = this.exportToJSON();
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		
		URL.revokeObjectURL(url);
	}

	// Optional: Load saved layout JSON back into canvas
	loadFromJSON(jsonString: string) {
		try {
			const data = JSON.parse(jsonString);
			if (data.canvas) {
				this.gridWidth = data.canvas.gridWidth ?? this.gridWidth;
				this.gridHeight = data.canvas.gridHeight ?? this.gridHeight;
			}
			if (Array.isArray(data.objects)) {
				this.objects = data.objects;
				this.selectedIds.clear();
				//this.clearHistory?.();
			}
		} catch (err) {
			console.error("Failed to parse seating layout JSON:", err);
		}
	}

	updateSelectedObjectMetadata(metadataUpdates: Record<string, any>) {
		this.objects = this.objects.map((obj) => {
			if (this.selectedIds.has(obj.id)) {
				return {
					...obj,
					metadata: {
						...(obj.metadata || {}),
						...metadataUpdates
					}
				};
			}
			return obj;
		});
	}
	// --- Add State Variables for Vertex Manipulation ---
	activeVertexDrag = $state<{ objId: string; index: number } | null>(null);

	// --- Drop Handler ---
	handleDrop = (event: DragEvent) => {
		event.preventDefault();
		const iconType = event.dataTransfer?.getData('iconType') as 'toilet' | 'entrance' | 'stage';
		const label = event.dataTransfer?.getData('label') || '';
		if (!iconType || !this.canvasElement) return;

		const rect = this.canvasElement.getBoundingClientRect();
		const screenX = event.clientX - rect.left;
		const screenY = event.clientY - rect.top;

		const canvasPt = {
			x: (screenX - this.panX) / this.scale,
			y: (screenY - this.panY) / this.scale
		};

		const w = 120;
		const h = 80;

		// Initial rectangular polygon vertices
		const initialPoints = [
			{ x: 0, y: 0 },
			{ x: w, y: 0 },
			{ x: w, y: h },
			{ x: 0, y: h }
		];

		const newObj = {
			id: `icon_poly_${Date.now()}`,
			type: 'env-icon-polygon' as const,
			iconType,
			label,
			x: Math.max(0, Math.min(canvasPt.x - (w / 2), this.gridWidth * GRID_SIZE - BOX_SIZE)),
			y: Math.max(0, Math.min(canvasPt.y - (h / 2), this.gridHeight * GRID_SIZE - BOX_SIZE)),
			width: w,
			height: h,
			points: initialPoints,
			rotation: 0
		};

		this.objects = [...this.objects, newObj];
		this.selectedIds = new Set([newObj.id]);
	};

	handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	};

	isPointInsideCanvas(worldX: number, worldY: number): boolean {
		const canvasWidth = this.gridWidth * GRID_SIZE;
		const canvasHeight = this.gridHeight * GRID_SIZE;

		return worldX >= 0 && worldX <= canvasWidth && worldY >= 0 && worldY <= canvasHeight;
	}

	// --- Vertex Interaction Handlers ---
	handleVertexMouseDown = (objId: string, index: number, event: MouseEvent) => {
		event.stopPropagation();
		this.activeVertexDrag = { objId, index };
	};

	addVertexAtMidpoint = (objId: string, index: number, event: MouseEvent) => {
		event.stopPropagation();
		const obj = this.objects.find((o) => o.id === objId);
		if (!obj || !obj.points) return;

		const nextIdx = (index + 1) % obj.points.length;
		const p1 = obj.points[index];
		const p2 = obj.points[nextIdx];

		const midpoint = {
			x: (p1.x + p2.x) / 2,
			y: (p1.y + p2.y) / 2
		};

		const newPoints = [...obj.points];
		newPoints.splice(index + 1, 0, midpoint);

		this.objects = this.objects.map((o) => (o.id === objId ? { ...o, points: newPoints } : o));
		this.activeVertexDrag = { objId, index:index + 1};
	};

	// --- Add inside SeatEditorState class ---

	// Bounding box and geometric center of current selection (in grid space)
	selectionBounds = $derived.by(() => {
		if (this.selectedIds.size === 0) return null;

		const selectedObjs = this.objects.filter((o) => this.selectedIds.has(o.id));
		if (selectedObjs.length === 0) return null;

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		selectedObjs.forEach((obj) => {
			const rad = ((obj.rotation || 0) * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);

			if (obj.points && obj.points.length > 0) {
				// Polygon Objects: Calculate bounds using actual vertex positions
				const centerRelX = obj.points.reduce((acc, p) => acc + p.x, 0) / obj.points.length;
				const centerRelY = obj.points.reduce((acc, p) => acc + p.y, 0) / obj.points.length;
				const cx = obj.x + centerRelX;
				const cy = obj.y + centerRelY;

				obj.points.forEach((p) => {
					const relX = p.x - centerRelX;
					const relY = p.y - centerRelY;
					const worldX = cx + (relX * cos - relY * sin);
					const worldY = cy + (relX * sin + relY * cos);
					minX = Math.min(minX, worldX);
					minY = Math.min(minY, worldY);
					maxX = Math.max(maxX, worldX);
					maxY = Math.max(maxY, worldY);
				});
			} else {
				// Standard Rect / Circle / Seat Objects
				const cx = obj.x + obj.width / 2;
				const cy = obj.y + obj.height / 2;
				const hw = obj.width / 2;
				const hh = obj.height / 2;

				const corners = [
					{ x: -hw, y: -hh },
					{ x: hw, y: -hh },
					{ x: hw, y: hh },
					{ x: -hw, y: hh }
				];

				corners.forEach((p) => {
					const worldX = cx + (p.x * cos - p.y * sin);
					const worldY = cy + (p.x * sin + p.y * cos);
					minX = Math.min(minX, worldX);
					minY = Math.min(minY, worldY);
					maxX = Math.max(maxX, worldX);
					maxY = Math.max(maxY, worldY);
				});
			}
		});

		return { minX, minY, maxX, maxY };
	});
	rotatePoint(
		px: number, 
		py: number, 
		cx: number, 
		cy: number, 
		angleDegrees: number
	): { x: number; y: number } {
		const rad = (angleDegrees * Math.PI) / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const dx = px - cx;
		const dy = py - cy;

		return {
			x: cx + (dx * cos - dy * sin),
			y: cy + (dx * sin + dy * cos)
		};
	}

	getObjectWorldExtents(
		obj: CanvasObject,
		customPos?: { x: number; y: number }
	): { minX: number; maxX: number; minY: number; maxY: number } {
		const posX = customPos ? customPos.x : obj.x;
		const posY = customPos ? customPos.y : obj.y;
		const rotation = obj.rotation ?? 0;

		let points: { x: number; y: number }[] = [];

		if ((obj.type === 'env-polygon' || obj.type === 'env-icon-polygon') && obj.points) {
			const centerRelX = obj.points.reduce((acc, p) => acc + p.x, 0) / obj.points.length;
			const centerRelY = obj.points.reduce((acc, p) => acc + p.y, 0) / obj.points.length;
			const cx = posX + centerRelX;
			const cy = posY + centerRelY;

			points = obj.points.map((p) => 
				this.rotatePoint(posX + p.x, posY + p.y, cx, cy, rotation)
			);
		} else if (obj.type === 'env-circle') {
			const cx = posX + obj.width / 2;
			const cy = posY + obj.height / 2;
			const a = obj.width / 2;
			const b = obj.height / 2;
			const rad = (rotation * Math.PI) / 180;

			const rx = Math.sqrt(Math.pow(a * Math.cos(rad), 2) + Math.pow(b * Math.sin(rad), 2));
			const ry = Math.sqrt(Math.pow(a * Math.sin(rad), 2) + Math.pow(b * Math.cos(rad), 2));

			return { minX: cx - rx, maxX: cx + rx, minY: cy - ry, maxY: cy + ry };
		} else {
			const cx = posX + obj.width / 2;
			const cy = posY + obj.height / 2;
			const corners = [
				{ x: posX, y: posY },
				{ x: posX + obj.width, y: posY },
				{ x: posX + obj.width, y: posY + obj.height },
				{ x: posX, y: posY + obj.height }
			];
			points = corners.map((p) => this.rotatePoint(p.x, p.y, cx, cy, rotation));
		}

		const xs = points.map((p) => p.x);
		const ys = points.map((p) => p.y);

		return {
			minX: Math.min(...xs),
			maxX: Math.max(...xs),
			minY: Math.min(...ys),
			maxY: Math.max(...ys)
		};
	}

	isObjectOutOfBounds(obj: CanvasObject): boolean {
		const canvasWidth = this.gridWidth * GRID_SIZE;
		const canvasHeight = this.gridHeight * GRID_SIZE;
		const rotation = obj.rotation ?? 0;

		let worldPoints: { x: number; y: number }[] = [];

		if ((obj.type === 'env-polygon' || obj.type === 'env-icon-polygon') && obj.points) {
			// 1. Polygon: Centroid pivot + relative points
			const centerRelX = obj.points.reduce((acc, p) => acc + p.x, 0) / obj.points.length;
			const centerRelY = obj.points.reduce((acc, p) => acc + p.y, 0) / obj.points.length;
			const cx = obj.x + centerRelX;
			const cy = obj.y + centerRelY;

			worldPoints = obj.points.map((p) => 
				this.rotatePoint(obj.x + p.x, obj.y + p.y, cx, cy, rotation)
			);
		} else if (obj.type === 'env-circle') {
			// 2. Ellipse: Calculate rotated bounding extents
			const cx = obj.x + obj.width / 2;
			const cy = obj.y + obj.height / 2;
			const a = obj.width / 2;
			const b = obj.height / 2;
			const rad = (rotation * Math.PI) / 180;

			const rx = Math.sqrt(Math.pow(a * Math.cos(rad), 2) + Math.pow(b * Math.sin(rad), 2));
			const ry = Math.sqrt(Math.pow(a * Math.sin(rad), 2) + Math.pow(b * Math.cos(rad), 2));

			worldPoints = [
				{ x: cx - rx, y: cy - ry },
				{ x: cx + rx, y: cy - ry },
				{ x: cx + rx, y: cy + ry },
				{ x: cx - rx, y: cy + ry }
			];
		} else {
			// 3. Rectangle / Seat: Bounding corners rotated around center
			const cx = obj.x + obj.width / 2;
			const cy = obj.y + obj.height / 2;

			const unrotatedCorners = [
				{ x: obj.x, y: obj.y },
				{ x: obj.x + obj.width, y: obj.y },
				{ x: obj.x + obj.width, y: obj.y + obj.height },
				{ x: obj.x, y: obj.y + obj.height }
			];

			worldPoints = unrotatedCorners.map((p) => 
				this.rotatePoint(p.x, p.y, cx, cy, rotation)
			);
		}

		// Returns true if ANY rotated vertex goes outside [0, canvasLimit]
		return worldPoints.some(
			(pt) => pt.x < 0 || pt.x > canvasWidth || pt.y < 0 || pt.y > canvasHeight
		);
	}

	// Start rotation interaction when user clicks rotation handle
	handleRotateStart = (event: MouseEvent) => {
		if (event.button !== 0 || !this.selectionBounds || !this.canvasElement) return;
			event.stopPropagation();

			this.isRotating = true;

			// Snapshot initial positions and rotations
			this.initialPositions = new Map();
			this.objects.forEach((obj) => {
				if (this.selectedIds.has(obj.id)) {
					this.initialStates.set(obj.id, {
						x: obj.x,
						y: obj.y,
						rotation: obj.rotation ?? 0
					});
				}
			});

			// Save group center pivot in WORLD coordinates
			const bounds = this.selectionBounds;
			const worldCenterX = (bounds.minX + bounds.maxX) / 2;
			const worldCenterY = (bounds.minY + bounds.maxY) / 2;
			this.rotateCenter = { x: worldCenterX, y: worldCenterY };

			// Calculate initial mouse angle relative to group center screen position
			const rect = this.canvasElement.getBoundingClientRect();
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;

			const screenCenterX = worldCenterX * this.scale + this.panX;
			const screenCenterY = worldCenterY * this.scale + this.panY;

			this.rotateStartAngle = Math.atan2(mouseY - screenCenterY, mouseX - screenCenterX) * (180 / Math.PI);
	};

	removeSelected = () => {
		if (this.selectedIds.size === 0) return;
		this.objects = this.objects.filter(o => !this.selectedIds.has(o.id));
		this.selectedIds = new Set();
	};

	copySelected = () => {
		if (this.selectedIds.size === 0) return;
		this.copiedObjects = this.objects
			.filter(o => this.selectedIds.has(o.id))
			.map(o => ({ ...o }));

		console.log(this.copiedObjects)
	};

	pasteSquares = () => {
		if (this.copiedObjects.length === 0) return;

		const nextBatch: CanvasObject[] = [];
		const nextSelected = new Set<string>();

		this.copiedObjects.forEach((src, idx) => {
			const newId = `${src.type}_${this.objects.length + idx + 1}`;
			const targetX = src.x + GRID_SIZE * 2;
			const targetY = src.y + GRID_SIZE * 2;

			nextBatch.push({
				id: newId,
				x: Math.max(0, Math.min(this.gridWidth * GRID_SIZE - BOX_SIZE, targetX)),
				y: Math.max(0, Math.min(this.gridHeight * GRID_SIZE - BOX_SIZE, targetY)),
				type: src.type,
				width: src.width,
				height: src.height,
				iconType:src.iconType,
				label:src.label,
				points:src.points?.map((p) => ({x:p.x, y:p.y} as Point)),
				rotation: src.rotation
			});
			nextSelected.add(newId);
		});

		this.objects = [...this.objects, ...nextBatch];
		console.log(this.objects)
		this.selectedIds = nextSelected;
		this.copiedObjects = nextBatch.map(s => ({ ...s }));
	};

	// Generic MouseDown handler for seats AND environment rectangles
	handleObjectMouseDown = (obj: CanvasObject, event: MouseEvent) => {
		if (event.button !== 0) return;
		event.stopPropagation();

		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;

		if (hasModifier) {
			const next = new Set(this.selectedIds);
			if (next.has(obj.id)) {
				next.delete(obj.id);
			} else {
				next.add(obj.id);
			}
			this.selectedIds = next;
		} else {
			if (!this.selectedIds.has(obj.id)) {
				this.selectedIds = new Set([obj.id]);
			}
		}

		// Prepare unified drag
		this.isDragging = true;
		this.dragStart = { x: event.clientX, y: event.clientY };
		this.initialPositions.clear();
		this.objects.forEach(o => {
			if (this.selectedIds.has(o.id)) {
				this.initialPositions.set(o.id, { x: o.x, y: o.y });
			}
		});
	};

	handleSelectionBoundsMouseDown = (event: MouseEvent) => {
		// Only trigger on primary left click
		if (event.button !== 0) return;
		
		// Prevent event from bubbling to the canvas background
		event.stopPropagation();

		this.isDragging = true;
		this.dragStart = { x: event.clientX, y: event.clientY };

		// Store initial positions for all currently selected objects
		this.initialPositions = new Map();
		this.objects.forEach((obj) => {
			if (this.selectedIds.has(obj.id)) {
				this.initialPositions.set(obj.id, { x: obj.x, y: obj.y });
			}
		});
	};

	handleCanvasMouseDown = (event: MouseEvent) => {
		if (!this.canvasElement) return;

		if (event.button === 2 || event.button === 1) {
			this.isPanning = true;
			this.panStart = { x: event.clientX - this.panX, y: event.clientY - this.panY };
			return;
		}

		const rect = this.canvasElement.getBoundingClientRect();
		const worldX = (event.clientX - rect.left - this.panX) / this.scale;
		const worldY = (event.clientY - rect.top - this.panY) / this.scale;

		// Ignore creation clicks outside the finite grid bounds
		if (this.activeTool !== 'pointer' && this.activeTool !== 'lasso'  && !this.isPointInsideCanvas(worldX, worldY)) {
			return;
		}

		const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		const canvasPoint = {
			x: (screenPoint.x - this.panX) / this.scale,
			y: (screenPoint.y - this.panY) / this.scale
		};

		const ctx = { state: this, event, screenPoint, canvasPoint };
		toolRegistry[this.activeTool]?.onMouseDown?.(ctx);
	};

	handleMouseMove = (event: MouseEvent) => {
		this.isShiftPressed = event.shiftKey;
		if (this.rafPending) return;
		this.rafPending = true;

		requestAnimationFrame(() => {
			this.rafPending = false;
			if (!this.canvasElement) return;

			const rect = this.canvasElement.getBoundingClientRect();
			const clientX = event.clientX;
			const clientY = event.clientY;

			// 1. Viewport Panning (Right Click)
			if (this.isPanning) {
				this.panX = clientX - this.panStart.x;
				this.panY = clientY - this.panStart.y;
				return;
			}

			// 2. Group Rotation (Rotation Handle Drag)
			if (this.isRotating) {
				const rect = this.canvasElement.getBoundingClientRect();
				const mouseX = event.clientX - rect.left;
				const mouseY = event.clientY - rect.top;

				const screenCenterX = this.rotateCenter.x * this.scale + this.panX;
				const screenCenterY = this.rotateCenter.y * this.scale + this.panY;

				const currentAngle = Math.atan2(mouseY - screenCenterY, mouseX - screenCenterX) * (180 / Math.PI);
				let deltaAngle = currentAngle - this.rotateStartAngle;

				// --- 1. ROTATION SNAPPING ---
				const SNAP_INCREMENT = 15; // Degrees to snap to

				if (this.isShiftPressed) {
					if (this.selectedIds.size === 1) {
						// Single Object: Snap target absolute angle to nearest step (e.g. 0°, 15°, 45°, 90°)
						const singleObjId = Array.from(this.selectedIds)[0];
						const initRot = this.initialStates.get(singleObjId)?.rotation ?? 0;
						const targetAbsoluteRot = initRot + deltaAngle;
						const snappedAbsoluteRot = Math.round(targetAbsoluteRot / SNAP_INCREMENT) * SNAP_INCREMENT;

						deltaAngle = snappedAbsoluteRot - initRot;
					} else {
						// Group Selection: Snap group delta step to preserve relative spatial alignment
						deltaAngle = Math.round(deltaAngle / SNAP_INCREMENT) * SNAP_INCREMENT;
					}
				}

				// --- 2. ORBIT CALCULATIONS ---
				const rad = (deltaAngle * Math.PI) / 180;
				const cos = Math.cos(rad);
				const sin = Math.sin(rad);

				const updatedObjects = this.objects.map((obj) => {
					if (!this.selectedIds.has(obj.id)) return obj;

					const init = this.initialStates.get(obj.id);
					if (!init) return obj;

					// Orbit origin (x, y) around group pivot center
					const dx = init.x - this.rotateCenter.x;
					const dy = init.y - this.rotateCenter.y;

					const newX = this.rotateCenter.x + (dx * cos - dy * sin);
					const newY = this.rotateCenter.y + (dx * sin + dy * cos);

					// Increment orientation
					const newRot = (init.rotation + deltaAngle) % 360;

					return {
						...obj,
						x: newX,
						y: newY,
						rotation: newRot < 0 ? newRot + 360 : newRot
					};
				});

				// --- 3. BOUNDARY VALIDATION ---
				const hasViolation = updatedObjects.some(
					(obj) => this.selectedIds.has(obj.id) && this.isObjectOutOfBounds(obj)
				);

				if (!hasViolation) {
					this.objects = updatedObjects;
				}
				return;
			}

			// 3. Object Dragging (Universal Object Movement)
			if (this.isDragging) {
				const rawDx = (event.clientX - this.dragStart.x) / this.scale;
				const rawDy = (event.clientY - this.dragStart.y) / this.scale;

				const canvasWidth = this.gridWidth * GRID_SIZE;
				const canvasHeight = this.gridHeight * GRID_SIZE;

				// Calculate current collective bounding box of all selected objects at initial positions
				let groupMinX = Infinity, groupMaxX = -Infinity;
				let groupMinY = Infinity, groupMaxY = -Infinity;

				this.objects.forEach((obj) => {
					if (!this.selectedIds.has(obj.id)) return;
					const init = this.initialPositions.get(obj.id) || { x: obj.x, y: obj.y };
					const extents = this.getObjectWorldExtents(obj, { x: init.x, y: init.y });

					groupMinX = Math.min(groupMinX, extents.minX);
					groupMaxX = Math.max(groupMaxX, extents.maxX);
					groupMinY = Math.min(groupMinY, extents.minY);
					groupMaxY = Math.max(groupMaxY, extents.maxY);
				});

				// Calculate maximum permissible delta along each axis
				const minAllowedDx = 0 - groupMinX;
				const maxAllowedDx = canvasWidth - groupMaxX;
				const minAllowedDy = 0 - groupMinY;
				const maxAllowedDy = canvasHeight - groupMaxY;

				// Clamp delta values independently (enables wall sliding)
				const clampedDx = Math.max(minAllowedDx, Math.min(maxAllowedDx, rawDx));
				const clampedDy = Math.max(minAllowedDy, Math.min(maxAllowedDy, rawDy));

				this.objects = this.objects.map((obj) => {
					if (!this.selectedIds.has(obj.id)) return obj;
					const init = this.initialPositions.get(obj.id);
					if (!init) return obj;

					return { ...obj, x: init.x + clampedDx, y: init.y + clampedDy };
				});
				return;
			}

			if (this.activeVertexDrag) {
				const { objId, index } = this.activeVertexDrag;
				const rect = this.canvasElement.getBoundingClientRect();
				const mouseX = (event.clientX - rect.left - this.panX) / this.scale;
				const mouseY = (event.clientY - rect.top - this.panY) / this.scale;

				this.objects = this.objects.map((obj) => {
					if (obj.id !== objId || !obj.points) return obj;

					// Create candidate vertex position relative to obj origin
					const candidatePoints = [...obj.points];
					candidatePoints[index] = { x: mouseX - obj.x, y: mouseY - obj.y };

					const candidateObj = { ...obj, points: candidatePoints };

					// Only update if candidate polygon stays inside canvas
					return this.isObjectOutOfBounds(candidateObj) ? obj : candidateObj;
				});
				return;
			}

			// 4. Delegate to tool-specific creation logic
			const screenPoint = { x: clientX - rect.left, y: clientY - rect.top };
			const canvasPoint = {
				x: (screenPoint.x - this.panX) / this.scale,
				y: (screenPoint.y - this.panY) / this.scale
			};

			const ctx = { state: this, event, screenPoint, canvasPoint };
			toolRegistry[this.activeTool]?.onMouseMove?.(ctx);
		});
	};

	handleMouseUp = (event: MouseEvent) => {
		if (this.activeVertexDrag) {
			this.activeVertexDrag = null;
			return;
		}
		const rect = this.canvasElement?.getBoundingClientRect();
		const screenPoint = rect
			? { x: event.clientX - rect.left, y: event.clientY - rect.top }
			: { x: 0, y: 0 };
		const canvasPoint = {
			x: (screenPoint.x - this.panX) / this.scale,
			y: (screenPoint.y - this.panY) / this.scale
		};

		const ctx = { state: this, event, screenPoint, canvasPoint };
		toolRegistry[this.activeTool]?.onMouseUp?.(ctx);

		// Reset global transform states
		this.isPanning = false;
		this.isRotating = false;
		this.isDragging = false;
	};

	handleWheel = (event: WheelEvent) => {
		event.preventDefault();
		if (event.deltaY < 0) {
			this.zoomIn();
		} else {
			this.zoomOut();
		}
	};

	handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			this.removeSelected();
			return;
		}
		if (event.key === 'Shift') {
			this.isShiftPressed = true;
		}
		// Polygon keyboard controls
		if (this.isPolygonDrawing) {
			const polyTool = toolRegistry['add-polygon'] as PolygonToolStrategy;
			if (event.key === 'Enter') {
				polyTool.finishPolygon(this);
			} else if (event.key === 'Escape') {
				polyTool.cancelPolygon(this);
			}
		}
		const isModifier = event.ctrlKey || event.metaKey;
		if (!isModifier) return;

		if (event.key.toLowerCase() === 'c') {
			event.preventDefault();
			this.copySelected();
		} else if (event.key.toLowerCase() === 'v') {
			event.preventDefault();
			this.pasteSquares();
		}
	};

	handleKeyUp = (event: KeyboardEvent) => {
		if (event.key === 'Shift') {
			this.isShiftPressed = false;
		}
	};

	// Optional: Reset on window blur to avoid stuck state
	handleWindowBlur = () => {
		this.isShiftPressed = false;
	};

	handleContextMenu = (event: MouseEvent) => {
		event.preventDefault();
	};
}