import { untrack } from "svelte";
import { BOX_SIZE, GRID_SIZE, MIN_SCALE, MAX_SCALE, GAP } from "./constants";
import type { Square, Point, Rect, ToolType, EnvObject } from "./types";

export class SeatEditorState {
	locationId = $state("v_123");
	gridWidth = $state(80);
	gridHeight = $state(60);

	activeTool = $state<ToolType>("pointer");

	scale = $state(1.0);
	panX = $state(0);
	panY = $state(0);
	isPanning = $state(false);
	panStart = $state<Point>({ x: 0, y: 0 });

	squares = $state<Square[]>([
		{ id: "s_1", x: 40, y: 40 },
		{ id: "s_2", x: 160, y: 40 }
	]);

	selectedIds = $state<Set<string>>(new Set(["s_1"]));
	copiedSquares = $state<Square[]>([]);

	isDragging = $state(false);
	dragStart = $state<Point>({ x: 0, y: 0 });
	initialPositions = new Map<string, Point>();

	// Marquee Box Selection
	isBoxSelecting = $state(false);
	boxStart = $state<Point>({ x: 0, y: 0 });
	boxEnd = $state<Point>({ x: 0, y: 0 });

	// Freeform Lasso Selection
	isLassoSelecting = $state(false);
	lassoPoints = $state<Point[]>([]);

	canvasElement = $state<HTMLDivElement | null>(null);

	private rafPending = false;

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
		// Spatial bucket size set to seat bounding dimension
		const cellSize = BOX_SIZE;
		const cellOf = (v: number) => Math.floor(v / cellSize);

		const buckets = new Map<string, Square[]>();

		// 1. Assign seats to spatial buckets based on continuous bounding box
		for (const s of this.squares) {
			const minX = cellOf(s.x);
			const maxX = cellOf(s.x + BOX_SIZE - 0.001);
			const minY = cellOf(s.y);
			const maxY = cellOf(s.y + BOX_SIZE - 0.001);

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

		// 2. Perform continuous AABB intersection tests within buckets
		for (const bucket of buckets.values()) {
			if (bucket.length < 2) continue;

			for (let i = 0; i < bucket.length; i++) {
				for (let j = i + 1; j < bucket.length; j++) {
					const a = bucket[i];
					const b = bucket[j];

					if (a.id === b.id) continue;

					// Two square seats overlap if their bounding boxes intersect on both axes
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
		this.squares = untrack(() =>
			this.squares.map(s => {
				if (s.x > maxX || s.y > maxY) {
					return {
						id: s.id,
						x: Math.max(0, Math.min(maxX, s.x)),
						y: Math.max(0, Math.min(maxY, s.y))
					};
				}
				return s;
			})
		);
	}

	private isPointInPolygon(point: Point, polygon: Point[]): boolean {
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

	exportAsJSON = () => {
		if (this.overlappingIds.size) return;
		if (typeof document === 'undefined') return;

		const exportData = {
			location_id: this.locationId,
			dimension: { width: this.gridWidth, height: this.gridHeight },
			seats: this.squares.map((s, idx) => ({
				seat_id: s.id.startsWith("s_") ? s.id : `s_${idx + 1}`,
				x: s.x,
				y: s.y
			}))
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `seating_layout_${this.locationId}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	// Replace existing addSquare method with addSquareAt
	addSquareAt = (screenX: number, screenY: number) => {
		// Convert screen coordinates relative to canvas into unscaled grid coordinates
		const rawX = (screenX - this.panX) / this.scale;
		const rawY = (screenY - this.panY) / this.scale;


		const maxX = this.gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = this.gridHeight * GRID_SIZE - BOX_SIZE;

		const newSquare: Square = {
			id: `s_${this.squares.length + 1}`,
			x: Math.max(0, Math.min(maxX, rawX - BOX_SIZE / 2)), // Center the square on the click position
			y: Math.max(0, Math.min(maxY, rawY - BOX_SIZE / 2))
		};

		this.squares = [...this.squares, newSquare];
		this.selectedIds = new Set([newSquare.id]);
		this.activeTool = "box-select"; // Switch back to pointer tool after adding
	};

	// Add state variables inside SeatEditorState class:
	isLineDrawing = $state(false);
	lineStart = $state<Point>({ x: 0, y: 0 });
	lineEnd = $state<Point>({ x: 0, y: 0 });

	// Derived preview seats calculated during mouse drag
	previewLineSeats = $derived.by<Point[]>(() => {
		if (!this.isLineDrawing) return [];
		return this.calculateLineSeats(this.lineStart, this.lineEnd);
	});

	private snapToAngle(start: Point, end: Point, stepDegrees: number = 15): Point {
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const distance = Math.hypot(dx, dy);

		if (distance === 0) return end;

		const angle = Math.atan2(dy, dx);
		const stepRadians = (stepDegrees * Math.PI) / 180;
		const snappedAngle = Math.round(angle / stepRadians) * stepRadians;

		return {
			x: start.x + distance * Math.cos(snappedAngle),
			y: start.y + distance * Math.sin(snappedAngle)
		};
	}
	// Interpolates coordinates along a line and snaps them to the grid
	calculateLineSeats(startScreen: Point, endScreen: Point): Point[] {
		const x1 = (startScreen.x - this.panX) / this.scale;
		const y1 = (startScreen.y - this.panY) / this.scale;
		const x2 = (endScreen.x - this.panX) / this.scale;
		const y2 = (endScreen.y - this.panY) / this.scale;

		const dx = x2 - x1;
		const dy = y2 - y1;
		const distance = Math.hypot(dx, dy);

		const maxX = this.gridWidth * GRID_SIZE - BOX_SIZE;
		const maxY = this.gridHeight * GRID_SIZE - BOX_SIZE;

		if (distance === 0) {
			return [{
				x: Math.max(0, Math.min(maxX, x1)),
				y: Math.max(0, Math.min(maxY, y1))
			}];
		}

		// Step continuously along vector direction spaced by seat width
		const stepSize = BOX_SIZE + GAP; // 10px gap between seats
		const seatCount = Math.floor(distance / stepSize);
		const ux = dx / distance;
		const uy = dy / distance;

		const lineSeats: Point[] = [];

		for (let i = 0; i <= seatCount; i++) {
			const posX = Math.max(0, Math.min(maxX, x1 + ux * i * stepSize));
			const posY = Math.max(0, Math.min(maxY, y1 + uy * i * stepSize));
			lineSeats.push({ x: posX, y: posY });
		}

		return lineSeats;
	}

	// 1. Add array tool state variables inside SeatEditorState class:
	isArrayDrawing = $state(false);
	arrayStart = $state<Point>({ x: 0, y: 0 });
	arrayEnd = $state<Point>({ x: 0, y: 0 });

	// Live ghost preview during drag
	previewArraySeats = $derived.by<Point[]>(() => {
		if (!this.isArrayDrawing) return [];
		return this.calculateArraySeats(this.arrayStart, this.arrayEnd);
	});

	// 2. Add matrix seat calculation logic
	calculateArraySeats(startScreen: Point, endScreen: Point): Point[] {
		const x1 = (startScreen.x - this.panX) / this.scale;
		const y1 = (startScreen.y - this.panY) / this.scale;
		const x2 = (endScreen.x - this.panX) / this.scale;
		const y2 = (endScreen.y - this.panY) / this.scale;

		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);

		const boundMaxX = this.gridWidth * GRID_SIZE - BOX_SIZE;
		const boundMaxY = this.gridHeight * GRID_SIZE - BOX_SIZE;

		// Stride includes seat size + 10px gap
		const stride = BOX_SIZE + GAP;

		const width = maxX - minX;
		const height = maxY - minY;

		// Calculate fitted rows and columns with gap spacing
		const cols = width < BOX_SIZE ? 1 : Math.floor((width - BOX_SIZE) / stride) + 1;
		const rows = height < BOX_SIZE ? 1 : Math.floor((height - BOX_SIZE) / stride) + 1;

		const arraySeats: Point[] = [];

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const posX = Math.max(0, Math.min(boundMaxX, minX + c * stride));
				const posY = Math.max(0, Math.min(boundMaxY, minY + r * stride));

				const overlapsExisting = this.squares.some(
					s => Math.abs(s.x - posX) < BOX_SIZE && Math.abs(s.y - posY) < BOX_SIZE
				);

				if (!overlapsExisting) {
					arraySeats.push({ x: posX, y: posY });
				}
			}
		}

		return arraySeats;
	}

	envObjects = $state<EnvObject[]>([]);
	isRectDrawing = $state(false);
	rectStart = $state<Point>({ x: 0, y: 0 });
	rectEnd = $state<Point>({ x: 0, y: 0 });

	// Live unscaled rectangle bounds derived during mouse drag
	previewRect = $derived.by<Rect | null>(() => {
		if (!this.isRectDrawing) return null;
		
		const x1 = (this.rectStart.x - this.panX) / this.scale;
		const y1 = (this.rectStart.y - this.panY) / this.scale;
		const x2 = (this.rectEnd.x - this.panX) / this.scale;
		const y2 = (this.rectEnd.y - this.panY) / this.scale;

		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		const width = Math.abs(x1 - x2);
		const height = Math.abs(y1 - y2);

		return { x, y, width, height };
	});

	// --- Add inside SeatEditorState class ---
	// Add inside SeatEditorState class:
	isRotating = $state(false);
	rotateStartAngle = $state(0);
	rotateCenter = $state<Point>({ x: 0, y: 0 });
	initialStates = new Map<string, { x: number; y: number; rotation: number }>();

	// Bounding box and geometric center of current selection (in grid space)
	selectionBounds = $derived.by(() => {
		if (this.selectedIds.size === 0) return null;
		const selected = this.squares.filter(s => this.selectedIds.has(s.id));
		
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const s of selected) {
			minX = Math.min(minX, s.x);
			minY = Math.min(minY, s.y);
			maxX = Math.max(maxX, s.x + BOX_SIZE);
			maxY = Math.max(maxY, s.y + BOX_SIZE);
		}

		return {
			minX,
			minY,
			maxX,
			maxY,
			centerX: (minX + maxX) / 2,
			centerY: (minY + maxY) / 2
		};
	});

	// Start rotation interaction when user clicks rotation handle
	handleRotateStart = (event: MouseEvent) => {
		event.stopPropagation();
		if (!this.selectionBounds || !this.canvasElement) return;

		this.isRotating = true;
		
		// Lock the center pivot point of the current selection group
		this.rotateCenter = {
			x: this.selectionBounds.centerX,
			y: this.selectionBounds.centerY
		};

		const rect = this.canvasElement.getBoundingClientRect();
		const screenCenterX = this.rotateCenter.x * this.scale + this.panX;
		const screenCenterY = this.rotateCenter.y * this.scale + this.panY;

		const clientX = event.clientX - rect.left;
		const clientY = event.clientY - rect.top;

		this.rotateStartAngle = Math.atan2(clientY - screenCenterY, clientX - screenCenterX);

		// Store initial position and rotation for each selected seat
		this.initialStates.clear();
		this.squares.forEach(s => {
			if (this.selectedIds.has(s.id)) {
				this.initialStates.set(s.id, {
					x: s.x,
					y: s.y,
					rotation: s.rotation ?? 0
				});
			}
		});
	};

	removeSelected = () => {
		if (this.selectedIds.size === 0) return;
		this.squares = this.squares.filter(s => !this.selectedIds.has(s.id));
		this.selectedIds = new Set();
	};

	copySelected = () => {
		if (this.selectedIds.size === 0) return;
		this.copiedSquares = this.squares
			.filter(s => this.selectedIds.has(s.id))
			.map(s => ({ ...s }));
	};

	pasteSquares = () => {
		if (this.copiedSquares.length === 0) return;

		const nextBatch: Square[] = [];
		const nextSelected = new Set<string>();

		this.copiedSquares.forEach((src, idx) => {
			const newId = `s_${this.squares.length + idx + 1}`;
			const targetX = src.x + GRID_SIZE * 2;
			const targetY = src.y + GRID_SIZE * 2;

			nextBatch.push({
				id: newId,
				x: Math.max(0, Math.min(this.gridWidth * GRID_SIZE - BOX_SIZE, targetX)),
				y: Math.max(0, Math.min(this.gridHeight * GRID_SIZE - BOX_SIZE, targetY))
			});
			nextSelected.add(newId);
		});

		this.squares = [...this.squares, ...nextBatch];
		this.selectedIds = nextSelected;
		this.copiedSquares = nextBatch.map(s => ({ ...s }));
	};

	handleSquareMouseDown = (square: Square, event: MouseEvent) => {
		if (event.button === 2) return;
		event.stopPropagation();
		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;

		if (hasModifier) {
			if (this.selectedIds.has(square.id)) {
				this.selectedIds.delete(square.id);
				this.selectedIds = new Set(this.selectedIds);
			} else {
				this.selectedIds = new Set([...this.selectedIds, square.id]);
			}
		} else {
			if (!this.selectedIds.has(square.id)) {
				this.selectedIds = new Set([square.id]);
			}
		}

		this.isDragging = true;
		this.dragStart = { x: event.clientX, y: event.clientY };

		this.initialPositions.clear();
		this.squares.forEach(s => {
			if (this.selectedIds.has(s.id)) {
				this.initialPositions.set(s.id, { x: s.x, y: s.y });
			}
		});
	};

	handleCanvasMouseDown = (event: MouseEvent) => {
		if (!this.canvasElement) return;

		if (event.button === 2) {
			this.isPanning = true;
			this.panStart = { x: event.clientX - this.panX, y: event.clientY - this.panY };
			return;
		}

		const rect = this.canvasElement.getBoundingClientRect();
		const clientX = event.clientX - rect.left;
		const clientY = event.clientY - rect.top;

		// Place a square at mouse position when tool is active
		if (this.activeTool === "add-square") {
			this.addSquareAt(clientX, clientY);
			return;
		}

		if (this.activeTool === "add-line") {
			this.isLineDrawing = true;
			this.lineStart = { x: clientX, y: clientY };
			this.lineEnd = { x: clientX, y: clientY };
			return;
		}
		if (this.activeTool === "add-array") {
			this.isArrayDrawing = true;
			this.arrayStart = { x: clientX, y: clientY };
			this.arrayEnd = { x: clientX, y: clientY };
			return;
		}
		if (this.activeTool === "add-rect") {
			this.isRectDrawing = true;
			this.rectStart = { x: clientX, y: clientY };
			this.rectEnd = { x: clientX, y: clientY };
			return;
		}

		const hasModifier = event.shiftKey || event.metaKey || event.ctrlKey;
		if (!hasModifier) {
			this.selectedIds = new Set();
		}


		if (this.activeTool === "lasso") {
			this.isLassoSelecting = true;
			this.lassoPoints = [{ x: clientX, y: clientY }];
		} else {
			this.isBoxSelecting = true;
			this.boxStart = { x: clientX, y: clientY };
			this.boxEnd = { x: clientX, y: clientY };
		}
	};

	handleMouseMove = (event: MouseEvent) => {
		if (this.rafPending) return;
		this.rafPending = true;
		let { clientX, clientY } = event;

		requestAnimationFrame(() => {
			this.rafPending = false;
			if (this.isPanning) {
				this.panX = clientX - this.panStart.x;
				this.panY = clientY - this.panStart.y;
			}
			else if (this.isRectDrawing && this.canvasElement) {
				const rect = this.canvasElement.getBoundingClientRect();
				this.rectEnd = { x: clientX - rect.left, y: clientY - rect.top };
			} 
			else if (this.isRotating && this.canvasElement) {
				const rect = this.canvasElement.getBoundingClientRect();
				const screenCenterX = this.rotateCenter.x * this.scale + this.panX;
				const screenCenterY = this.rotateCenter.y * this.scale + this.panY;

				const currentPointX = clientX - rect.left;
				const currentPointY = clientY - rect.top;

				const currentAngle = Math.atan2(currentPointY - screenCenterY, currentPointX - screenCenterX);
				let deltaDeg = ((currentAngle - this.rotateStartAngle) * 180) / Math.PI;

				// Shift key snaps rotation angle to 15° steps
				if (event.shiftKey) {
					deltaDeg = Math.round(deltaDeg / 15) * 15;
				}

				const deltaRad = (deltaDeg * Math.PI) / 180;
				const cos = Math.cos(deltaRad);
				const sin = Math.sin(deltaRad);

				const boundMaxX = this.gridWidth * GRID_SIZE - BOX_SIZE;
				const boundMaxY = this.gridHeight * GRID_SIZE - BOX_SIZE;

				this.squares = this.squares.map(s => {
					const initial = this.initialStates.get(s.id);
					if (initial) {
						// 1. Get initial center of the individual seat
						const initialCenterX = initial.x + BOX_SIZE / 2;
						const initialCenterY = initial.y + BOX_SIZE / 2;

						// 2. Vector offset relative to group rotation center
						const dx = initialCenterX - this.rotateCenter.x;
						const dy = initialCenterY - this.rotateCenter.y;

						// 3. 2D rotation matrix formula (orbiting transformation)
						const rotatedDx = dx * cos - dy * sin;
						const rotatedDy = dx * sin + dy * cos;

						const newCenterX = this.rotateCenter.x + rotatedDx;
						const newCenterY = this.rotateCenter.y + rotatedDy;

						// 4. Update individual orientation angle
						let newRotation = (initial.rotation + deltaDeg) % 360;
						if (newRotation < 0) newRotation += 360;

						return {
							...s,
							x: Math.max(0, Math.min(boundMaxX, newCenterX - BOX_SIZE / 2)),
							y: Math.max(0, Math.min(boundMaxY, newCenterY - BOX_SIZE / 2)),
							rotation: newRotation
						};
					}
					return s;
				});
			} else if (this.isArrayDrawing && this.canvasElement) {
				const rect = this.canvasElement.getBoundingClientRect();
				this.arrayEnd = { x: clientX - rect.left, y: clientY - rect.top };
			} else if (this.isLineDrawing && this.canvasElement) {
				const rect = this.canvasElement.getBoundingClientRect();
				const currentPoint = { x: clientX - rect.left, y: clientY - rect.top };
				if (event.shiftKey) {
					// Snaps to 15-degree increments (24 directions)
					this.lineEnd = this.snapToAngle(this.lineStart, currentPoint, 22.5);
				} else {
					this.lineEnd = currentPoint;
				}
			} else if (this.isDragging) {
				const dx = (clientX - this.dragStart.x) / this.scale;
				const dy = (clientY - this.dragStart.y) / this.scale;

				this.squares = this.squares.map(s => {
					const initial = this.initialPositions.get(s.id);
					if (initial) {
						let rawX = initial.x + dx;
						let rawY = initial.y + dy;

						return {
							...s,
							x: Math.max(0, Math.min(this.gridWidth * GRID_SIZE - BOX_SIZE, rawX)),
							y: Math.max(0, Math.min(this.gridHeight * GRID_SIZE - BOX_SIZE, rawY))
						};
					}
					return s;
				});
			} else if (this.isLassoSelecting && this.canvasElement) {
				const rect = this.canvasElement.getBoundingClientRect();
				this.lassoPoints = [
					...this.lassoPoints,
					{ x: clientX - rect.left, y: clientY - rect.top }
				];
			} else if (this.isBoxSelecting && this.canvasElement) {
				const rect = this.canvasElement.getBoundingClientRect();
				this.boxEnd = { x: clientX - rect.left, y: clientY - rect.top };

				const box = this.marqueeRect;
				if (box) {
					const currentSelection = new Set<string>();
					this.squares.forEach(s => {
						const screenX = s.x * this.scale + this.panX;
						const screenY = s.y * this.scale + this.panY;
						const screenBoxSize = BOX_SIZE * this.scale;

						const intersects = !(screenX > box.x + box.width ||
							screenX + screenBoxSize < box.x ||
							screenY > box.y + box.height ||
							screenY + screenBoxSize < box.y);
						if (intersects) {
							currentSelection.add(s.id);
						}
					});
					this.selectedIds = currentSelection;
				}
			}
		});
	};

	handleMouseUp = () => {
		this.isRotating = false;
		if (this.isLassoSelecting && this.lassoPoints.length > 2) {
			const gridPolygon: Point[] = this.lassoPoints.map(p => ({
				x: (p.x - this.panX) / this.scale,
				y: (p.y - this.panY) / this.scale
			}));

			const newlySelected = new Set(this.selectedIds);
			this.squares.forEach(s => {
				const seatCenter: Point = {
					x: s.x + BOX_SIZE / 2,
					y: s.y + BOX_SIZE / 2
				};
				if (this.isPointInPolygon(seatCenter, gridPolygon)) {
					newlySelected.add(s.id);
				}
			});

			this.selectedIds = newlySelected;
		}
		if (this.isRectDrawing) {
			const shape = this.previewRect;
			// Minimum size check to prevent accidental zero-size clicks
			if (shape && shape.width > 5 && shape.height > 5) {
				const newRect: EnvObject = {
					id: `env_${this.envObjects.length + 1}`,
					type: 'rect',
					x: shape.x,
					y: shape.y,
					width: shape.width,
					height: shape.height
				};
				this.envObjects = [...this.envObjects, newRect];
			}
			this.isRectDrawing = false;
		}
		if (this.isLineDrawing) {
			const lineSeats = this.calculateLineSeats(this.lineStart, this.lineEnd);
			if (lineSeats.length > 0) {
				const nextBatch: Square[] = [];
				const nextSelected = new Set<string>();

				lineSeats.forEach((pt, idx) => {
					const newId = `s_${this.squares.length + idx + 1}`;
					nextBatch.push({ id: newId, x: pt.x, y: pt.y });
					nextSelected.add(newId);
				});

				this.squares = [...this.squares, ...nextBatch];
				this.selectedIds = nextSelected;
			}
			this.isLineDrawing = false;
		}
		if (this.isArrayDrawing) {
			const arraySeats = this.calculateArraySeats(this.arrayStart, this.arrayEnd);
			if (arraySeats.length > 0) {
				const nextBatch: Square[] = [];
				const nextSelected = new Set<string>();

				arraySeats.forEach((pt, idx) => {
					const newId = `s_${this.squares.length + idx + 1}`;
					nextBatch.push({ id: newId, x: pt.x, y: pt.y });
					nextSelected.add(newId);
				});

				this.squares = [...this.squares, ...nextBatch];
				this.selectedIds = nextSelected;
			}
			this.isArrayDrawing = false;
		}

		this.isDragging = false;
		this.isBoxSelecting = false;
		this.isLassoSelecting = false;
		this.lassoPoints = [];
		this.isPanning = false;
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

	handleContextMenu = (event: MouseEvent) => {
		event.preventDefault();
	};
}