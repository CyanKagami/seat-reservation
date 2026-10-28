import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SeatEditorState } from './seatState.svelte';
import { GRID_SIZE, BOX_SIZE, MAX_SCALE, MIN_SCALE } from './constants';
import type { CanvasObject } from './types';
import { TOOLS } from './config/tools';

function createKeyEvent(code: string, modifiers: Partial<KeyboardEvent> = {}) {
    return {
        code,
        target: null,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
        ...modifiers
    } as unknown as KeyboardEvent;
}

describe('SeatEditorState', () => {
    let state: SeatEditorState;

    beforeEach(() => {
        state = new SeatEditorState('test_location');
    });

    describe('tool shortcuts', () => {
        it.each(TOOLS.filter((tool) => tool.shortcut))('selects $id with its shortcut', (tool) => {
            const event = createKeyEvent(`Key${tool.shortcut}`);

            state.handleKeyDown(event);

            expect(state.activeTool).toBe(tool.id);
            expect(event.preventDefault).toHaveBeenCalledOnce();
        });

        it('does not select a tool when a modifier is held', () => {
            state.activeTool = 'add-square';

            state.handleKeyDown(createKeyEvent('KeyL', { ctrlKey: true }));

            expect(state.activeTool).toBe('add-square');
        });
    });

    describe('moveSquareOnOutOfBound', () => {
        it('should move seat inside the bounds if it is out of bounds', () => {
            const gridWidth = 10;
            const gridHeight = 10;
            const maxX = gridWidth * GRID_SIZE - BOX_SIZE; // 100 - 20 = 80
            const maxY = gridHeight * GRID_SIZE - BOX_SIZE; // 100 - 20 = 80

            state.objects = [
                { id: 'seat_1', type: 'seat', x: 100, y: 100 } as CanvasObject
            ];

            state.moveSquareOnOutOfBound(gridWidth, gridHeight);

            expect(state.objects[0].x).toBe(maxX);
            expect(state.objects[0].y).toBe(maxY);
        });

        it('should not move seat if it is within bounds', () => {
            const gridWidth = 10;
            const gridHeight = 10;
            state.objects = [
                { id: 'seat_2', type: 'seat', x: 50, y: 50 } as CanvasObject
            ];

            state.moveSquareOnOutOfBound(gridWidth, gridHeight);

            expect(state.objects[0].x).toBe(50);
            expect(state.objects[0].y).toBe(50);
        });
    });

    describe('isPointInsideCanvas', () => {
        it('should return true for points inside the canvas', () => {
            state.gridWidth = 80;
            state.gridHeight = 60;
            
            expect(state.isPointInsideCanvas(0, 0)).toBe(true);
            expect(state.isPointInsideCanvas(400, 300)).toBe(true);
            expect(state.isPointInsideCanvas(800, 600)).toBe(true); // 80 * 10 = 800, 60 * 10 = 600
        });

        describe('canvas click with an existing selection', () => {
            it('clears the selection without starting the active tool', () => {
                state.canvasElement = {
                    getBoundingClientRect: () => ({ left: 0, top: 0 })
                } as HTMLDivElement;
                state.objects = [
                    { id: 'seat_1', type: 'seat', x: 10, y: 10, width: 20, height: 20, metadata: {} }
                ];
                state.selectedIds = new Set(['seat_1']);
                state.activeTool = 'add-circle';

                state.handleCanvasMouseDown({
                    button: 0,
                    clientX: 50,
                    clientY: 50
                } as MouseEvent);

                expect(state.selectedIds.size).toBe(0);
                expect(state.isCircleDrawing).toBe(false);
                expect(state.objects).toHaveLength(1);
            });

            it('keeps the active tool behavior when nothing is selected', () => {
                state.canvasElement = {
                    getBoundingClientRect: () => ({ left: 0, top: 0 })
                } as HTMLDivElement;
                state.activeTool = 'add-circle';

                state.handleCanvasMouseDown({
                    button: 0,
                    clientX: 50,
                    clientY: 50
                } as MouseEvent);

                expect(state.isCircleDrawing).toBe(true);
            });
        });

        it('should return false for points outside the canvas', () => {
            state.gridWidth = 80;
            state.gridHeight = 60;
            
            expect(state.isPointInsideCanvas(-1, 0)).toBe(false);
            expect(state.isPointInsideCanvas(0, -1)).toBe(false);
            expect(state.isPointInsideCanvas(801, 300)).toBe(false);
            expect(state.isPointInsideCanvas(400, 601)).toBe(false);
        });
    });

    describe('rotatePoint', () => {
        it('should rotate a point correctly around a center by 90 degrees', () => {
            // Rotate (10, 0) around (0, 0) by 90 degrees -> should become (0, 10)
            const result = state.rotatePoint(10, 0, 0, 0, 90);
            
            expect(result.x).toBeCloseTo(0);
            expect(result.y).toBeCloseTo(10);
        });

        it('should rotate a point correctly around a center by 180 degrees', () => {
            // Rotate (10, 0) around (0, 0) by 180 degrees -> should become (-10, 0)
            const result = state.rotatePoint(10, 0, 0, 0, 180);
            
            expect(result.x).toBeCloseTo(-10);
            expect(result.y).toBeCloseTo(0);
        });
    });

    describe('clipboard and deletion (removeSelected, copySelected, pasteSquares)', () => {
        beforeEach(() => {
            state.objects = [
                { id: 'seat_1', type: 'seat', x: 0, y: 0, width: 20, height: 20 } as CanvasObject,
                { id: 'seat_2', type: 'seat', x: 50, y: 50, width: 20, height: 20 } as CanvasObject,
                { id: 'rect_1', type: 'env-rect', x: 100, y: 100, width: 50, height: 50 } as CanvasObject
            ];
        });

        it('should remove selected objects', () => {
            state.selectedIds = new Set(['seat_1', 'rect_1']);
            state.removeSelected();
            
            expect(state.objects.length).toBe(1);
            expect(state.objects[0].id).toBe('seat_2');
            expect(state.selectedIds.size).toBe(0);
        });

        it('should copy selected objects', () => {
            state.selectedIds = new Set(['seat_2']);
            state.copySelected();
            
            expect(state.copiedObjects.length).toBe(1);
            expect(state.copiedObjects[0].id).toBe('seat_2');
        });

        it('should paste copied objects with offset and correct ID', () => {
            state.selectedIds = new Set(['seat_1']);
            state.copySelected();
            state.pasteSquares();
            
            // Should add a new object based on highest seat ID + 1 -> seat_3
            expect(state.objects.length).toBe(4);
            const pastedObject = state.objects.find(o => o.id === 'seat_3');
            expect(pastedObject).toBeDefined();
            
            // Check offset applied (GRID_SIZE * 2)
            expect(pastedObject?.x).toBe(0 + GRID_SIZE * 2);
            expect(pastedObject?.y).toBe(0 + GRID_SIZE * 2);
            
            // Ensure the pasted object is selected
            expect(state.selectedIds.has('seat_3')).toBe(true);
        });
    });

    describe('zoom interactions (zoomIn, zoomOut, resetZoom)', () => {
        it('should increase scale by 0.1 when zooming in', () => {
            state.scale = 1.0;
            state.zoomIn();
            expect(state.scale).toBeCloseTo(1.1);
        });

        it('should cap zooming in at MAX_SCALE', () => {
            state.scale = MAX_SCALE;
            state.zoomIn();
            expect(state.scale).toBe(MAX_SCALE);
        });

        it('should decrease scale by 0.1 when zooming out', () => {
            state.scale = 1.0;
            state.zoomOut();
            expect(state.scale).toBeCloseTo(0.9);
        });

        it('should cap zooming out at MIN_SCALE', () => {
            state.scale = MIN_SCALE;
            state.zoomOut();
            expect(state.scale).toBe(MIN_SCALE);
        });

        it('should reset scale to 1.0 and recenter grid on resetZoom', () => {
            state.scale = 2.0;
            state.panX = 100;
            state.panY = 100;
            
            // Mock canvas element for centerGrid calculation
            state.canvasElement = {
                clientWidth: 1000,
                clientHeight: 800
            } as HTMLDivElement;

            state.resetZoom();

            expect(state.scale).toBe(1.0);
            
            // Expected panX: (clientWidth - gridWidth * GRID_SIZE * scale) / 2
            // Expected panX: (1000 - 80 * 10 * 1.0) / 2 = (1000 - 800) / 2 = 100
            expect(state.panX).toBe(100);
            
            // Expected panY: (clientHeight - gridHeight * GRID_SIZE * scale) / 2
            // Expected panY: (800 - 60 * 10 * 1.0) / 2 = (800 - 600) / 2 = 100
            expect(state.panY).toBe(100);
        });
    });

    describe('updateSelectedObjectMetadata', () => {
        it('should update metadata for selected objects', () => {
            state.objects = [
                { id: 'seat_1', type: 'seat', x: 0, y: 0, width: 20, height: 20, metadata: { foo: 'bar' } } as CanvasObject,
                { id: 'seat_2', type: 'seat', x: 20, y: 0, width: 20, height: 20, metadata: {} } as CanvasObject
            ];
            
            state.selectedIds = new Set(['seat_1']);
            state.updateSelectedObjectMetadata({ price: 100 });
            
            expect(state.objects[0].metadata).toEqual({ foo: 'bar', price: 100 });
            expect(state.objects[1].metadata).toEqual({}); // unchanged
        });
    });

    describe('seatTypes CRUD', () => {
        it('should create a new seat type and prevent duplicate names', () => {
            const created = state.createSeatType({
                name: 'VIP',
                color: '#gold',
                description: 'VIP Sofa',
                picture: 'data:image/png;base64,...'
            });

            expect(created).toBeDefined();
            expect(state.seatTypes['VIP']).toEqual({
                name: 'VIP',
                color: '#gold',
                description: 'VIP Sofa',
                picture: 'data:image/png;base64,...'
            });

            // Prevent duplicate name
            const duplicate = state.createSeatType({
                name: 'VIP',
                color: '#silver'
            });
            expect(duplicate).toBeNull();
        });

        it('should update a seat type without changing name', () => {
            state.createSeatType({ name: 'Deluxe', color: '#blue', description: 'Old desc' });
            
            const updated = state.updateSeatType('Deluxe', {
                name: 'Deluxe',
                color: '#purple',
                description: 'New desc'
            });

            expect(updated).toBe(true);
            expect(state.seatTypes['Deluxe'].color).toBe('#purple');
            expect(state.seatTypes['Deluxe'].description).toBe('New desc');
        });

        it('should rename a seat type and update referencing seats on canvas', () => {
            state.createSeatType({ name: 'OldName', color: '#111' });
            state.objects = [
                { id: 's1', type: 'seat', x: 0, y: 0, width: 20, height: 20, metadata: { seatType: 'OldName' } } as CanvasObject,
                { id: 's2', type: 'seat', x: 20, y: 0, width: 20, height: 20, metadata: { seatType: 'standard' } } as CanvasObject
            ];

            const updated = state.updateSeatType('OldName', {
                name: 'NewName',
                color: '#222'
            });

            expect(updated).toBe(true);
            expect(state.seatTypes['OldName']).toBeUndefined();
            expect(state.seatTypes['NewName']).toBeDefined();
            expect(state.seatTypes['NewName'].color).toBe('#222');
            expect(state.objects[0].metadata?.seatType).toBe('NewName');
            expect(state.objects[1].metadata?.seatType).toBe('standard');
        });

        it('should prevent renaming to an already existing seat type name', () => {
            state.createSeatType({ name: 'TypeA', color: '#aaa' });
            state.createSeatType({ name: 'TypeB', color: '#bbb' });

            const updated = state.updateSeatType('TypeA', {
                name: 'TypeB',
                color: '#ccc'
            });

            expect(updated).toBe(false);
            expect(state.seatTypes['TypeA']).toBeDefined();
        });

        it('should remove a seat type and revert matching seats to standard', () => {
            state.createSeatType({ name: 'ToDelete', color: '#red' });
            state.objects = [
                { id: 's1', type: 'seat', x: 0, y: 0, width: 20, height: 20, metadata: { seatType: 'ToDelete' } } as CanvasObject
            ];

            // Cannot remove standard
            expect(state.removeSeatType('standard')).toBe(false);

            const removed = state.removeSeatType('ToDelete');
            expect(removed).toBe(true);
            expect(state.seatTypes['ToDelete']).toBeUndefined();
            expect(state.objects[0].metadata?.seatType).toBe('standard');

            // Cannot remove non-existent
            expect(state.removeSeatType('NonExistent')).toBe(false);
        });
    });
});
