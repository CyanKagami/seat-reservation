import { BOX_SIZE, GRID_SIZE, MIN_SCALE, MAX_SCALE, GAP } from "./constants";
import type { Point, Rect, ToolType, CanvasObject, Zone } from "./types";
import { toolRegistry } from "./tools";
import { rotatePoint } from '../canvas-shared/utils';
import { decode, encode } from "@msgpack/msgpack";
import type { SeatType } from "../canvas-shared/types";
import {
	ensureReadableReservationSeatIds,
	getLegacySeatIds,
	getReservationSeatId,
	getSeatLabel
} from "./utils/zoneUtils";
import { apiFetch } from "$lib/scripts/api";
import { alertModal } from "$lib/store/alert.svelte";
import { TOOLS } from "./config/tools";

interface ZoneLayoutSnapshot {
	objects: CanvasObject[];
	zones: Record<string, Zone>;
	seatTypes: Record<string, SeatType>;
	gridWidth: number;
	gridHeight: number;
}

export class ZoneEditorState {
	private static readonly MAX_HISTORY_DEPTH = 50;

	locationId = $state("");
	eventId = $state("");
	gridWidth = $state(80);
	gridHeight = $state(60);
	isSaving = $state(false);
	isResetting = $state(false);

	// Canvas & Active Tool State
	objects = $state<CanvasObject[]>([]);
	zones = $state<{[key: string]: Zone;}>({})
	seatTypes = $state<{[key: string]: SeatType;}>({ 'standard': { name: 'standard', color: '#e2e8f0', description: 'Standard seat' } });
	selectedIds = $state<Set<string>>(new Set());
	activeTool = $state<ToolType>('pointer');
	canvasElement = $state<HTMLDivElement | null>(null);

	history = $state<ZoneLayoutSnapshot[]>([]);
	historyIndex = $state(-1);
	canUndo = $derived(this.historyIndex > 0);
	canRedo = $derived(this.historyIndex < this.history.length - 1);

	// Viewport State
	panX = $state(0);
	panY = $state(0);
	scale = $state(1);

	// Interaction Flags & Points
	isPanning = $state(false);
	panStart = $state<Point>({ x: 0, y: 0 });

	isBoxSelecting = $state(false);
	boxStart = $state<Point>({ x: 0, y: 0 });
	boxEnd = $state<Point>({ x: 0, y: 0 });

	isLassoSelecting = $state(false);
	lassoPoints = $state<Point[]>([]);

	constructor(locationId:string, eventId:string) {
		this.locationId = locationId;
		this.eventId = eventId;
		this.commitHistory();
	}

	private createLayoutSnapshot(): ZoneLayoutSnapshot {
		return {
			objects: $state.snapshot(this.objects) as CanvasObject[],
			zones: $state.snapshot(this.zones) as Record<string, Zone>,
			seatTypes: $state.snapshot(this.seatTypes) as Record<string, SeatType>,
			gridWidth: this.gridWidth,
			gridHeight: this.gridHeight
		};
	}

	private restoreLayoutSnapshot(snapshot: ZoneLayoutSnapshot) {
		const copy = JSON.parse(JSON.stringify(snapshot)) as ZoneLayoutSnapshot;
		this.objects = copy.objects;
		this.zones = copy.zones;
		this.seatTypes = copy.seatTypes;
		this.gridWidth = copy.gridWidth;
		this.gridHeight = copy.gridHeight;
		this.selectedIds = new Set();
	}

	commitHistory() {
		const snapshot = this.createLayoutSnapshot();
		const current = this.history[this.historyIndex];
		if (current && JSON.stringify(current) === JSON.stringify(snapshot)) return;

		const nextHistory = this.history.slice(0, this.historyIndex + 1);
		nextHistory.push(snapshot);
		if (nextHistory.length > ZoneEditorState.MAX_HISTORY_DEPTH) nextHistory.shift();
		this.history = nextHistory;
		this.historyIndex = nextHistory.length - 1;
	}

	private resetHistory() {
		this.history = [];
		this.historyIndex = -1;
		this.commitHistory();
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

	private rafPending = false;

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

	seatIdValidation = $derived.by(() => {
		const seatIdCounts = new Map<string, number>();
		const internalIds = new Set<string>();
		const duplicateInternalIds = new Set<string>();

		for (const object of this.objects) {
			if (object.type !== 'seat') continue;
			const internalId = getReservationSeatId(object);
			if (internalIds.has(internalId)) {
				duplicateInternalIds.add(internalId);
			}
			internalIds.add(internalId);

			const seatLabel = getSeatLabel(object);
			if (seatLabel) {
				const identifier = `โซน ${object.metadata.zone || 'ไม่มีโซน'} รหัสที่นั่ง ${seatLabel}`;
				seatIdCounts.set(identifier, (seatIdCounts.get(identifier) ?? 0) + 1);
			}
		}

		return {
			duplicateSeatIds: [
				...Array.from(seatIdCounts)
				.filter(([, count]) => count > 1)
				.map(([seatId]) => seatId),
				...Array.from(duplicateInternalIds, (id) => `รหัสภายใน ${id}`)
			]
		};
	});

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

	handleSaveButtonClick = async (event:MouseEvent) => {
		if (this.isSaving) return;
		await this.uploadToAPI();
	}

	handleResetToPlaceLayout = () => {
		if (this.isSaving || this.isResetting) return;

		alertModal.warning(
			'รีเซ็ตผังที่นั่ง',
			'การดำเนินการนี้จะแทนที่ข้อมูลในตัวแก้ไขด้วยผังปัจจุบันของสถานที่ และยกเลิกการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการดำเนินการต่อหรือไม่?',
			{
				showCancel: true,
				confirmText: 'รีเซ็ตผัง',
				cancelText: 'ยกเลิก',
				onconfirm: () => this.resetToPlaceLayout()
			}
		);
	};

	private async resetToPlaceLayout() {
		if (this.isSaving || this.isResetting) return;
		this.isSaving = true;
		this.isResetting = true;

		try {
			const response = await apiFetch(`/place/layout?placeId=${encodeURIComponent(this.locationId)}`);
			if (!response.ok) {
				throw new Error('Unable to load place layout.');
			}

			const loaded = this.loadFromMessagePack(await response.arrayBuffer());
			if (loaded) {
				alertModal.success(
					'โหลดผังสถานที่แล้ว',
					'ผังปัจจุบันของสถานที่ถูกโหลดในตัวแก้ไขแล้ว กรุณากดบันทึกเพื่อใช้ผังนี้กับกิจกรรม'
				);
			}
		} catch (error) {
			alertModal.failure('รีเซ็ตผังไม่สำเร็จ', 'ไม่สามารถโหลดผังปัจจุบันของสถานที่ได้ กรุณาลองอีกครั้ง');
		} finally {
			this.isSaving = false;
			this.isResetting = false;
		}
	}

	async uploadToAPI(apiEndpoint = '/api/place/layout') {
		if (this.isSaving || this.isResetting) return;
		const { duplicateSeatIds } = this.seatIdValidation;
		if (duplicateSeatIds.length > 0) {
			alertModal.warning(
				'ยังบันทึกผังไม่ได้',
				`พบรหัสที่นั่งซ้ำ: ${duplicateSeatIds.join(', ')} กรุณาแก้ไขให้แต่ละที่นั่งมีรหัสไม่ซ้ำกัน`
			);
			return;
		}
		this.isSaving = true;

		try {
			this.selectedIds.clear();
			const binaryData = this.exportToMessagePack();
			const blob = new Blob([binaryData as any], { type: 'application/msgpack' });
			const file = new File([blob], `${this.locationId}.msgpack`, {
				type: blob.type,
				lastModified: Date.now()
			});
			const formData = new FormData();
			formData.append('layoutFile', file);
			formData.append('eventId', this.eventId);

			const res = await apiFetch("/event/layout", {
				method: "PUT",
				body: formData
			});

			if (res.ok) {
				alertModal.success("บันทึกสำเร็จ", "การเปลี่ยนแปลงของคุณได้รับการบันทึกแล้ว")
			} else {
				const err = await res.json();
				alertModal.failure("บันทึกล้มเหลว", "การเปลี่ยนแปลงของคุณยังไม่ได้รับการบันทึก กรุณาลองอีกครั้ง")
			}
		} catch (err) {
			alertModal.failure("ล้มเหลว", "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ")
		} finally {
			this.isSaving = false;
		}	
	}

	exportToMessagePack(): Uint8Array {
		const layoutPayload = {
			version: "1.0",
			timestamp: new Date().toISOString(),
			canvas: {
				gridWidth: this.gridWidth,
				gridHeight: this.gridHeight,
			},
			zones:$state.snapshot(this.zones),
			seatTypes: $state.snapshot(this.seatTypes),
			// Strip Svelte 5 reactive proxy wrappers before binary encoding
			objects: $state.snapshot(this.objects)
		};

		return encode(layoutPayload);
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

		// Freeze editing after save
		this.isSaving = true;
		this.selectedIds.clear();
	}

	loadFromMessagePack(buffer: ArrayBuffer): boolean {
		try {
			const data = decode(buffer) as any;
			if (!data || typeof data !== 'object' || !Array.isArray(data.objects)) {
				throw new Error('Invalid layout data.');
			}

			this.gridWidth = data.canvas?.gridWidth ?? 80;
			this.gridHeight = data.canvas?.gridHeight ?? 60;
			this.seatTypes = data.seatTypes ?? {
				standard: { name: 'standard', color: '#e2e8f0', description: 'Standard seat' }
			};
			this.objects = ensureReadableReservationSeatIds(data.objects);
			this.zones = data.zones ?? {};
			this.selectedIds.clear();
			this.centerGrid();
			this.resetHistory();
			return true;
		} catch (err) {
			alertModal.failure("เกิดข้อผิดพลาด", "ไม่สามารถอ่านไฟล์ผังที่นั่งได้");
			return false;
		}
	}

	createZone = ({name, color}:{name:string, color:string}) => {
		if (this.zones[name]) return null;
		this.zones[name] = {color};
		this.commitHistory();
		return this.zones[name];
	}

	deleteZone(zoneName: string) {
		if (!this.zones[zoneName]) return;

		this.objects = this.objects.map((obj) => {
			if (obj.metadata?.zone !== zoneName) return obj;
			const metadata = { ...obj.metadata };
			delete metadata.zone;
			return { ...obj, metadata };
		});
		delete this.zones[zoneName];
		this.commitHistory();
	}

	updateSelectedObjectZone(zone: string, selectedIds: ReadonlySet<string> = this.selectedIds) {
		this.objects = this.objects.map((obj) => {
			if (!selectedIds.has(obj.id)) return obj;

			const metadata = { ...(obj.metadata || {}) };
			const zoneChanged = (metadata.zone ?? '') !== zone;
			if (zone) {
				metadata.zone = zone;
			} else {
				delete metadata.zone;
			}

			if (obj.type === 'seat' && zoneChanged && !metadata.isManualLabel) {
				delete metadata.row;
				delete metadata.seatNo;
				delete metadata.isManualLabel;
			}

			return { ...obj, metadata };
		});
		this.commitHistory();
	}

	clearSeatLabels(seatIds: readonly string[]) {
		const selectedSeatIds = new Set(seatIds);
		this.objects = this.objects.map((obj) => {
			if (obj.type !== 'seat' || !selectedSeatIds.has(obj.id)) return obj;

			const metadata = { ...(obj.metadata || {}) };
			delete metadata.row;
			delete metadata.seatNo;
			delete metadata.isManualLabel;
			return { ...obj, metadata };
		});
		this.commitHistory();
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
		this.commitHistory();
	}

	clearSelectedObjectManualLabels() {
		this.objects = this.objects.map((obj) => {
			if (!this.selectedIds.has(obj.id)) return obj;
			const metadata = { ...(obj.metadata || {}) };
			delete metadata.isManualLabel;
			return { ...obj, metadata };
		});
		this.commitHistory();
	}

	autoLabelSelectedSeats = (seatIds: readonly string[], overwriteManual: boolean = false) => {
		const selectedSeats = this.objects.filter(
			(object) => object.type === 'seat' && seatIds.includes(object.id)
		);
		const seatsByZone = new Map<string, CanvasObject[]>();
		for (const seat of selectedSeats) {
			const zoneName = seat.metadata?.zone ?? '';
			const zoneSeats = seatsByZone.get(zoneName) ?? [];
			zoneSeats.push(seat);
			seatsByZone.set(zoneName, zoneSeats);
		}
		for (const seats of seatsByZone.values()) {
			this.autoLabelSeats(seats, overwriteManual);
		}
		this.commitHistory();
	};

	autoLabelZone = (zoneName: string, overwriteManual: boolean = false) => {
		if (!zoneName) return;
		const zoneSeats = this.objects.filter(
			(o) => o.type === 'seat' && o.metadata?.zone === zoneName
		);
		this.autoLabelSeats(zoneSeats, overwriteManual);
		this.commitHistory();
	};

	private autoLabelSeats(seats: CanvasObject[], overwriteManual: boolean) {
		if (seats.length === 0) return;
		const ROW_TOLERANCE = BOX_SIZE / 2;
		const seatCenters = seats.map((seat) => ({
			seat,
			x: seat.x + seat.width / 2,
			y: seat.y + seat.height / 2
		}));
		const shearSlope = this.estimateSeatRowSlope(seatCenters, ROW_TOLERANCE);

		const sorted = seatCenters
			.map((center) => ({
				...center,
				rowPosition: center.y - shearSlope * center.x,
				seatPosition: center.x + shearSlope * center.y
			}))
			.sort((a, b) => a.rowPosition - b.rowPosition || a.seatPosition - b.seatPosition);

		// Group into rows by Y proximity
		const rows: (typeof sorted)[] = [];
		for (const center of sorted) {
			const matchingRow = rows.find(
				(row) => Math.abs(center.rowPosition - row[0].rowPosition) <= ROW_TOLERANCE
			);
			if (matchingRow) {
				matchingRow.push(center);
			} else {
				rows.push([center]);
			}
		}

		// Sort rows from top to bottom after compensating for the estimated shear.
		rows.sort((r1, r2) => r1[0].rowPosition - r2[0].rowPosition);

		// Sort each row along its slanted direction.
		rows.forEach((row) => row.sort((a, b) => a.seatPosition - b.seatPosition));

		// Helper to convert 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA...
		const getRowLetter = (index: number) => {
			let str = '';
			let num = index;
			while (num >= 0) {
				str = String.fromCharCode(65 + (num % 26)) + str;
				num = Math.floor(num / 26) - 1;
			}
			return str;
		};

		// Assign labels to seats in objects
		const seatIds = new Set(seats.map((seat) => seat.id));
		this.objects = this.objects.map((obj) => {
			if (obj.type !== 'seat' || !seatIds.has(obj.id)) return obj;
			if (!overwriteManual && obj.metadata?.isManualLabel) return obj;

			const rowIdx = rows.findIndex((row) => row.some((center) => center.seat.id === obj.id));
			if (rowIdx === -1) return obj;

			const colIdx = rows[rowIdx].findIndex((center) => center.seat.id === obj.id);
			const rowLetter = getRowLetter(rowIdx);
			const seatNumber = String(colIdx + 1);

			return {
				...obj,
				metadata: {
					...(obj.metadata || {}),
					row: rowLetter,
					seatNo: seatNumber,
					isManualLabel: overwriteManual ? false : (obj.metadata?.isManualLabel ?? false)
				}
			};
		});
	};

	private estimateSeatRowSlope(
		seats: { x: number; y: number; seat: CanvasObject }[],
		rowTolerance: number
	) {
		if (seats.length < 2) return 0;

		const xValues = seats.map((seat) => seat.x).sort((a, b) => a - b);
		const xSpan = xValues[xValues.length - 1] - xValues[0];
		const minimumGap = Math.max(1, BOX_SIZE / 2);
		if (xSpan < minimumGap) return 0;

		const binWidth = rowTolerance / Math.max(xSpan, BOX_SIZE);
		const slopeVotes = new Map<number, number>();

		for (let i = 0; i < seats.length; i++) {
			for (let j = i + 1; j < seats.length; j++) {
				const dx = seats[j].x - seats[i].x;
				if (Math.abs(dx) < minimumGap) continue;

				const slope = (seats[j].y - seats[i].y) / dx;
				if (!Number.isFinite(slope) || Math.abs(slope) > 2) continue;

				const bin = Math.round(slope / binWidth);
				slopeVotes.set(bin, (slopeVotes.get(bin) ?? 0) + 1);
			}
		}

		let bestBin = 0;
		let bestVotes = 0;
		for (const [bin, votes] of slopeVotes) {
			if (votes > bestVotes || (votes === bestVotes && Math.abs(bin) < Math.abs(bestBin))) {
				bestBin = bin;
				bestVotes = votes;
			}
		}

		return bestBin * binWidth;
	}

	// --- Add State Variables for Vertex Manipulation ---
	activeVertexDrag = $state<{ objId: string; index: number } | null>(null);

	// --- Drop Handler ---
	handleDrop = (event: DragEvent) => {
		event.preventDefault();
		if (this.isSaving) return;
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
		if (this.isSaving) return;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	};

	isPointInsideCanvas(worldX: number, worldY: number): boolean {
		const canvasWidth = this.gridWidth * GRID_SIZE;
		const canvasHeight = this.gridHeight * GRID_SIZE;

		return worldX >= 0 && worldX <= canvasWidth && worldY >= 0 && worldY <= canvasHeight;
	}

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
		return rotatePoint(px, py, cx, cy, angleDegrees);
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

	// Generic MouseDown handler for seats AND environment rectangles
		handleSeatMouseDown = (obj: CanvasObject, event: MouseEvent) => {

			event.stopPropagation();
			if (this.isSaving) return;
			if (event.button !== 0) return;
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
		};
	



	// Generic MouseDown handler for seats AND environment rectangles
	handleObjectMouseDown = (obj: CanvasObject, event: MouseEvent) => {
		if (this.isSaving) return;
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

	};

	handleSelectionBoundsMouseDown = (event: MouseEvent) => {
		if (this.isSaving) return;
		// Only trigger on primary left click
		if (event.button !== 0) return;
		
		// Prevent event from bubbling to the canvas background
		event.stopPropagation();

	};

	handleCanvasMouseDown = (event: MouseEvent) => {
		if (this.isSaving) return;
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
		if (this.isSaving) return;
		if (this.activeVertexDrag) {
			this.activeVertexDrag = null;
			this.commitHistory();
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
		this.commitHistory();
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
		if (this.isSaving) return;
		const target = event.target;
		if (
			typeof HTMLElement !== 'undefined' &&
			target instanceof HTMLElement &&
			(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		) return;
		if (event.ctrlKey || event.metaKey) {
			if (event.code === 'KeyZ') {
				event.preventDefault();
				if (event.shiftKey) this.redo();
				else this.undo();
			} else if (event.code === 'KeyY') {
				event.preventDefault();
				this.redo();
			}
			return;
		}
		if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

		const tool = TOOLS.find((item) => item.shortcut && event.code === `Key${item.shortcut}`);
		if (!tool) return;

		event.preventDefault();
		this.activeTool = tool.id;
	};

	handleContextMenu = (event: MouseEvent) => {
		event.preventDefault();
	};
}