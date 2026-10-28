import { untrack } from "svelte";
import { BOX_SIZE, GRID_SIZE, MIN_SCALE, MAX_SCALE, GAP } from "./constants";
import type { Point, Rect, ToolType, CanvasObject, SeatType } from "./types";
import { rotatePoint } from '../canvas-shared/utils';
import {
	createReservationSeatId,
	ensureReadableReservationSeatIds
} from '../zone-editor/utils/zoneUtils';
import { toolRegistry } from "./tools";
import type { LineToolStrategy } from "./tools/LineTool";
import type { ArrayToolStrategy } from "./tools/ArrayTool";
import type { CircleToolStrategy } from "./tools/CircleTool";
import type { RectToolStrategy } from "./tools/RectTool";
import type { PolygonToolStrategy } from "./tools/PolygonTool";
import { apiFetch } from "$lib/scripts/api";
import { alertModal } from "$lib/store/alert.svelte";
import { appendLayoutSnapshot, cloneLayoutSnapshot, type LayoutSnapshot } from "./history";
import { decodeLayout, encodeLayout } from "./layout";
import {
	getPolygonRotationCenter,
	movePolygonVertex,
	snapPolygonVertexToNeighborAxis
} from "./polygonGeometry";

export class SeatEditorState {
	locationId = $state("v_123");
	gridWidth = $state(80);
	gridHeight = $state(60);
	isSeatTypePopupOpen = $state(false);
	isSaving = $state(false);
	isUneditable = $derived(this.isSaving || this.isSeatTypePopupOpen);

	// Canvas & Active Tool State
	objects = $state<CanvasObject[]>([]);
	seatTypes = $state<{[key: string]: SeatType;}>({ 'standard': { name: 'standard', color: '#e2e8f0', description: 'Standard seat' } });
	copiedObjects = $state<CanvasObject[]>([]);
	selectedIds = $state<Set<string>>(new Set());
	activeTool = $state<ToolType>('pointer');
	canvasElement = $state<HTMLDivElement | null>(null);

	// Undo/Redo History
	private static readonly MAX_HISTORY_DEPTH = 50;
	history = $state<LayoutSnapshot[]>([]);
	historyIndex = $state<number>(-1);

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

	createObjectId(prefix: string, reservedIds: Iterable<string> = []): string {
		return this.createObjectIds(prefix, 1, reservedIds)[0];
	}

	createObjectIds(prefix: string, count: number, reservedIds: Iterable<string> = []): string[] {
		const existingIds = new Set([...this.objects.map((object) => object.id), ...reservedIds]);
		const ids: string[] = [];
		let nextId = 1;
		while (ids.length < count) {
			const id = `${prefix}_${nextId++}`;
			if (existingIds.has(id)) continue;
			ids.push(id);
			existingIds.add(id);
		}
		return ids;
	}

	private createLayoutSnapshot(): LayoutSnapshot {
		return {
			objects: $state.snapshot(this.objects) as CanvasObject[],
			seatTypes: $state.snapshot(this.seatTypes) as Record<string, SeatType>,
			gridWidth: this.gridWidth,
			gridHeight: this.gridHeight
		};
	}

	private restoreLayoutSnapshot(snapshot: LayoutSnapshot) {
		const copy = cloneLayoutSnapshot(snapshot);
		this.objects = copy.objects;
		this.seatTypes = copy.seatTypes;
		this.gridWidth = copy.gridWidth;
		this.gridHeight = copy.gridHeight;
		this.selectedIds = new Set();
	}

	// --- Undo/Redo History Management ---

	canUndo = $derived(this.historyIndex > 0);
	canRedo = $derived(this.historyIndex < this.history.length - 1);

	commitHistory() {
		const result = appendLayoutSnapshot(
			this.history,
			this.historyIndex,
			this.createLayoutSnapshot(),
			SeatEditorState.MAX_HISTORY_DEPTH
		);
		this.history = result.history;
		this.historyIndex = result.historyIndex;
	}

	undo = () => {
		if (!this.canUndo) return;
		this.historyIndex--;
		this.restoreLayoutSnapshot(this.history[this.historyIndex]);
	};

	redo = () => {
		if (!this.canRedo) return;
		this.historyIndex++;
		this.restoreLayoutSnapshot(this.history[this.historyIndex]);
	};

	clearHistory() {
		this.history = [];
		this.historyIndex = -1;
	}

	commitGridDimensionChange = () => {
		const previous = this.history[this.historyIndex];
		if (!Number.isInteger(this.gridWidth) || this.gridWidth < BOX_SIZE * 2 || this.gridWidth > 3000) {
			this.gridWidth = previous?.gridWidth ?? 80;
		}
		if (!Number.isInteger(this.gridHeight) || this.gridHeight < BOX_SIZE * 2 || this.gridHeight > 3000) {
			this.gridHeight = previous?.gridHeight ?? 60;
		}
		this.moveSquareOnOutOfBound(this.gridWidth, this.gridHeight);
		this.commitHistory();
	};

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
		const canvasWidth = gridWidth * GRID_SIZE;
		const canvasHeight = gridHeight * GRID_SIZE;
		this.objects = untrack(() =>
			this.objects.map(o => {
				const extents = this.getObjectWorldExtents(o);
				const dx = Math.max(-extents.minX, Math.min(canvasWidth - extents.maxX, 0));
				const dy = Math.max(-extents.minY, Math.min(canvasHeight - extents.maxY, 0));
				if (dx === 0 && dy === 0) return o;
				return { ...o, x: o.x + dx, y: o.y + dy };
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

	createSeatType = ({name, color, description, picture}:{name:string, color:string, description?: string, picture?: string | null}) => {
		if (this.isSaving || this.seatTypes[name]) return null;
		this.seatTypes[name] = {name, color, description, picture: picture ?? undefined};
		this.commitHistory();
		return this.seatTypes[name];
	}

	updateSeatType = (
		oldName: string,
		{ name, color, description, picture }: { name: string; color: string; description?: string; picture?: string | null }
	) => {
		if (this.isSaving) return false;
		if (!this.seatTypes[oldName]) return false;
		if (name !== oldName && this.seatTypes[name]) return false;

		const updatedType: SeatType = {
			name,
			color,
			description: description ?? '',
			picture: picture ?? undefined
		};

		if (name !== oldName) {
			delete this.seatTypes[oldName];
			this.seatTypes[name] = updatedType;

			// Update all seats that reference the old name
			this.objects = this.objects.map((obj) => {
				if (obj.type === 'seat' && obj.metadata?.seatType === oldName) {
					return {
						...obj,
						metadata: {
							...obj.metadata,
							seatType: name
						}
					};
				}
				return obj;
			});
		} else {
			this.seatTypes[name] = updatedType;
		}

		this.commitHistory();
		return true;
	};

	removeSeatType = (name: string) => {
		if (this.isSaving || name === 'standard') return false;
		if (!this.seatTypes[name]) return false;

		delete this.seatTypes[name];

		// Revert any seats with this seatType to 'standard'
		this.objects = this.objects.map((obj) => {
			if (obj.type === 'seat' && obj.metadata?.seatType === name) {
				return {
					...obj,
					metadata: {
						...obj.metadata,
						seatType: 'standard'
					}
				};
			}
			return obj;
		});

		this.commitHistory();
		return true;
	};

	handleSaveButtonClick = async (event:MouseEvent) => {
		if (this.isSaving) return;
		await this.uploadToAPI()
	}

	async uploadToAPI() {
		if (this.isSaving) return;
		this.isSaving = true;

		try {
			const binaryData = this.exportToMessagePack();
			const blob = new Blob([binaryData as any], { type: 'application/msgpack' });
			const file = new File([blob], `${this.locationId}.msgpack`, {
				type: blob.type,
				lastModified: Date.now()
			});
			const formData = new FormData();
			formData.append('layoutFile', file);
			formData.append('placeId', this.locationId);

			const res = await apiFetch("/place/layout", {
				method: "PUT",
				body: formData
			});

			if (res.ok) {
				alertModal.success("บันทึกสำเร็จ", "การเปลี่ยนแปลงของคุณได้รับการบันทึกแล้ว")
			} else {
				await res.json();
				alertModal.failure("บันทึกล้มเหลว", "การเปลี่ยนแปลงของคุณยังไม่ได้รับการบันทึก กรุณาลองอีกครั้ง")
			}
		} catch (err) {
			alertModal.failure("ล้มเหลว", "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ")
		} finally {
			this.isSaving = false;
		}	
	}

	exportToMessagePack(): Uint8Array {
		return encodeLayout(this.createLayoutSnapshot());
	}

	saveToMessagePackFile(filename = "seating-layout.msgpack") {
		const binaryData = this.exportToMessagePack();
		
		// Create binary Blob
		const blob = new Blob([binaryData as any], { type: "application/msgpack" });
		const url = URL.createObjectURL(blob);

		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		anchor.click();

		URL.revokeObjectURL(url);

		this.selectedIds.clear();
	}

	loadFromMessagePack(buffer: ArrayBuffer) {
		try {
			const layout = decodeLayout(buffer);
			layout.objects = ensureReadableReservationSeatIds(layout.objects);
			this.restoreLayoutSnapshot(layout);
			this.centerGrid();
			this.clearHistory();
			this.commitHistory();
		} catch (err) {
			alertModal.failure("เกิดข้อผิดพลาด", "ไม่สามารถอ่านไฟล์ผังที่นั่งได้");
		}
	}

	updateSelectedObjectMetadata(metadataUpdates: Record<string, any>) {
		if (this.isSaving) return;
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
		this.commitHistory();
	}
	// --- Add State Variables for Vertex Manipulation ---
	activeVertexDrag = $state<{ objId: string; index: number; rotationCenter: Point } | null>(null);
	vertexSnapPoint = $state<Point | null>(null);

	// --- Drop Handler ---
	handleDrop = (event: DragEvent) => {
		event.preventDefault();
		if (this.isUneditable) return;
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
			rotation: 0,
			metadata: {}
		};

		this.objects = [...this.objects, newObj];
		this.selectedIds = new Set([newObj.id]);
		this.commitHistory();
	};

	handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		if (this.isUneditable) return;
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
		if (this.isUneditable) return;
		const obj = this.objects.find((object) => object.id === objId);
		if (!obj?.points) return;
		this.activeVertexDrag = { objId, index, rotationCenter: getPolygonRotationCenter(obj) };
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
		this.activeVertexDrag = {
			objId,
			index: index + 1,
			rotationCenter: getPolygonRotationCenter(obj)
		};
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
				const { x: centerRelX, y: centerRelY } = getPolygonRotationCenter(obj);
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
		return rotatePoint(px, py, cx, cy, angleDegrees);
	}

	getObjectWorldExtents(
		obj: CanvasObject,
		customPos?: { x: number; y: number }
	): { minX: number; maxX: number; minY: number; maxY: number } {
		const posX = customPos ? customPos.x : obj.x;
		const posY = customPos ? customPos.y : obj.y;
		const rotation = obj.rotation ?? 0;
		const width = obj.width ?? BOX_SIZE;
		const height = obj.height ?? BOX_SIZE;

		let points: { x: number; y: number }[] = [];

		if ((obj.type === 'env-polygon' || obj.type === 'env-icon-polygon') && obj.points) {
			const { x: centerRelX, y: centerRelY } = getPolygonRotationCenter(obj);
			const cx = posX + centerRelX;
			const cy = posY + centerRelY;

			points = obj.points.map((p) => 
				this.rotatePoint(posX + p.x, posY + p.y, cx, cy, rotation)
			);
		} else if (obj.type === 'env-circle') {
			const cx = posX + width / 2;
			const cy = posY + height / 2;
			const a = width / 2;
			const b = height / 2;
			const rad = (rotation * Math.PI) / 180;

			const rx = Math.sqrt(Math.pow(a * Math.cos(rad), 2) + Math.pow(b * Math.sin(rad), 2));
			const ry = Math.sqrt(Math.pow(a * Math.sin(rad), 2) + Math.pow(b * Math.cos(rad), 2));

			return { minX: cx - rx, maxX: cx + rx, minY: cy - ry, maxY: cy + ry };
		} else {
			const cx = posX + width / 2;
			const cy = posY + height / 2;
			const corners = [
				{ x: posX, y: posY },
				{ x: posX + width, y: posY },
				{ x: posX + width, y: posY + height },
				{ x: posX, y: posY + height }
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
			const { x: centerRelX, y: centerRelY } = getPolygonRotationCenter(obj);
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
		if (this.isUneditable) return;
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
		this.commitHistory();
	};

	copySelected = () => {
		if (this.selectedIds.size === 0) return;
		this.copiedObjects = this.objects
			.filter(o => this.selectedIds.has(o.id))
			.map((o) => JSON.parse(JSON.stringify($state.snapshot(o))) as CanvasObject);

	};

	pasteSquares = () => {
		if (this.copiedObjects.length === 0) return;

		const nextBatch: CanvasObject[] = [];
		const nextSelected = new Set<string>();
		const reservedIds: string[] = [];
		this.copiedObjects.forEach((src, idx) => {
			const newId = this.createObjectId(src.type, reservedIds);
			reservedIds.push(newId);
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
				rotation: src.rotation,
				metadata: {
					...(src.metadata ? JSON.parse(JSON.stringify(src.metadata)) : {}),
					...(src.type === 'seat'
						? { reservationId: createReservationSeatId(), legacyReservationIds: [] }
						: {})
				}
			});
			nextSelected.add(newId);
		});
		this.objects = [...this.objects, ...nextBatch];
		this.selectedIds = nextSelected;
		this.copiedObjects = nextBatch.map((object) =>
			JSON.parse(JSON.stringify(object)) as CanvasObject
		);
		this.commitHistory();
	};

	// Generic MouseDown handler for seats AND environment rectangles
	handleObjectMouseDown = (obj: CanvasObject, event: MouseEvent) => {
		if (this.isUneditable) return;
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
		if (this.isUneditable) return;
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
		if (this.isUneditable) return;
		if (!this.canvasElement) return;

		if (event.button === 2 || event.button === 1) {
			this.isPanning = true;
			this.panStart = { x: event.clientX - this.panX, y: event.clientY - this.panY };
			return;
		}

		if (event.button === 0 && this.selectedIds.size > 0) {
			this.selectedIds = new Set();
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
		this.commitHistory();
	};

	handleMouseMove = (event: MouseEvent) => {
		this.isShiftPressed = event.shiftKey || this.isShiftPressed;
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

					const w = obj.width ?? BOX_SIZE;
					const h = obj.height ?? BOX_SIZE;

					// 1. Calculate the initial CENTER point of this object
					const initCenterX = init.x + w / 2;
					const initCenterY = init.y + h / 2;

					// 2. Vector from group pivot center to object center
					const dx = initCenterX - this.rotateCenter.x;
					const dy = initCenterY - this.rotateCenter.y;

					// 3. Orbit object center around group pivot center
					const newCenterX = this.rotateCenter.x + (dx * cos - dy * sin);
					const newCenterY = this.rotateCenter.y + (dx * sin + dy * cos);

					// 4. Convert back to Top-Left (x, y)
					const newX = newCenterX - w / 2;
					const newY = newCenterY - h / 2;

					// 5. Update rotation orientation
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
				const { objId, index, rotationCenter } = this.activeVertexDrag;
				const rect = this.canvasElement.getBoundingClientRect();
				const mouseX = (event.clientX - rect.left - this.panX) / this.scale;
				const mouseY = (event.clientY - rect.top - this.panY) / this.scale;
				const obj = this.objects.find((object) => object.id === objId);
				const shiftPressed = event.shiftKey || this.isShiftPressed;
				const pointer = obj && shiftPressed
					? snapPolygonVertexToNeighborAxis(
						obj,
						index,
						{ x: mouseX, y: mouseY },
						36 / this.scale,
						12 / this.scale
					)
					: { x: mouseX, y: mouseY };
				this.vertexSnapPoint =
					pointer.x !== mouseX || pointer.y !== mouseY ? pointer : null;

				this.objects = this.objects.map((obj) => {
					if (obj.id !== objId || !obj.points) return obj;

					const candidateObj = movePolygonVertex(obj, index, pointer);
					candidateObj.rotationCenter = rotationCenter;

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
		const wasLocked = this.isUneditable;
		const hadDocumentInteraction = this.isDragging || this.isRotating || this.activeVertexDrag !== null ||
			this.isArrayDrawing || this.isLineDrawing || this.isRectDrawing || this.isCircleDrawing;
		if (!wasLocked) {
			const rect = this.canvasElement?.getBoundingClientRect();
			const screenPoint = rect
				? { x: event.clientX - rect.left, y: event.clientY - rect.top }
				: { x: 0, y: 0 };
			const canvasPoint = {
				x: (screenPoint.x - this.panX) / this.scale,
				y: (screenPoint.y - this.panY) / this.scale
			};
			toolRegistry[this.activeTool]?.onMouseUp?.({ state: this, event, screenPoint, canvasPoint });
		}
		this.clearInteractionState();
		if (!wasLocked && hadDocumentInteraction) this.commitHistory();
	};

	private clearInteractionState() {
		this.isPanning = false;
		this.isRotating = false;
		this.isDragging = false;
		this.activeVertexDrag = null;
		this.vertexSnapPoint = null;
		this.isBoxSelecting = false;
		this.isLassoSelecting = false;
		this.isArrayDrawing = false;
		this.isLineDrawing = false;
		this.isRectDrawing = false;
		this.isCircleDrawing = false;
		this.initialPositions.clear();
		this.initialStates.clear();
	}

	handlePointerCancel = () => {
		const hadDocumentInteraction = this.isDragging || this.isRotating || this.activeVertexDrag !== null;
		this.clearInteractionState();
		if (hadDocumentInteraction) this.commitHistory();
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
		if (this.isUneditable) return;
		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		) return;
		if (event.code === 'Delete' || event.code === 'Backspace') {
			event.preventDefault();
			this.removeSelected();
			return;
		}
		if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
			this.isShiftPressed = true;
		}
		// Polygon keyboard controls
		if (this.isPolygonDrawing) {
			const polyTool = toolRegistry['add-polygon'] as PolygonToolStrategy;
			if (event.code === 'Enter') {
				polyTool.finishPolygon(this);
				this.commitHistory();
			} else if (event.code === 'Escape') {
				polyTool.cancelPolygon(this);
			}
		}
		const isModifier = event.ctrlKey || event.metaKey;
		if (!isModifier) return;

		if (event.code === 'KeyC') {
			event.preventDefault();
			this.copySelected();
		} else if (event.code === 'KeyV') {
			event.preventDefault();
			this.pasteSquares();
		} else if (event.code === 'KeyZ') {
			event.preventDefault();
			if (event.shiftKey) {
				this.redo();
			} else {
				this.undo();
			}
		} else if (event.code === 'KeyY') {
			event.preventDefault();
			this.redo();
		}
	};

	handleKeyUp = (event: KeyboardEvent) => {
		if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
			this.isShiftPressed = false;
		}
	};

	handleWindowBlur = () => {
		this.handlePointerCancel();
		this.isShiftPressed = false;
		this.isPolygonDrawing = false;
		this.polygonPoints = [];
	};

	handleObjectKeyDown = (obj: CanvasObject, event: KeyboardEvent) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		if (this.isUneditable) return;
		this.selectedIds = event.shiftKey ? new Set([...this.selectedIds, obj.id]) : new Set([obj.id]);
	};

	handleContextMenu = (event: MouseEvent) => {
		event.preventDefault();
	};
}