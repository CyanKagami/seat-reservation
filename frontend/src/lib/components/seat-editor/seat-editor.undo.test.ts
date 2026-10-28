import { describe, it, expect, beforeEach } from 'vitest';
import { SeatEditorState } from './seatState.svelte';
import { SingleSeatToolStrategy } from './tools/SingleSeatTool';

describe('Undo/Redo History', () => {
	let state: SeatEditorState;

	beforeEach(() => {
		state = new SeatEditorState('place-1');
	});

	it('should maintain history when adding and moving objects', () => {
		expect(state.canUndo).toBe(false);
		expect(state.canRedo).toBe(false);

		// Initial commit on load
		state.commitHistory();
		
		const tool = new SingleSeatToolStrategy();
		tool.onMouseDown({ state, canvasPoint: { x: 100, y: 100 }, event: {} as any, screenPoint: { x: 100, y: 100 } });
		
		// Simulate mouse up committing history
		state.commitHistory();
		
		expect(state.history.length).toBe(2);
		expect(state.canUndo).toBe(true);
		expect(state.objects.length).toBe(1);

		state.undo();
		expect(state.objects.length).toBe(0);
		expect(state.canUndo).toBe(false);
		expect(state.canRedo).toBe(true);

		state.redo();
		expect(state.objects.length).toBe(1);
		expect(state.canUndo).toBe(true);
		expect(state.canRedo).toBe(false);
	});

	it('should enforce MAX_HISTORY_DEPTH', () => {
		state.commitHistory(); // Index 0
		
		for (let i = 0; i < 55; i++) {
			state.objects = [{ id: 'test_'+i, type: 'seat', x: i, y: i, width: 20, height: 20, metadata: {} }];
			state.commitHistory();
		}

		expect(state.history.length).toBe(50); // MAX_HISTORY_DEPTH
		expect(state.historyIndex).toBe(49);
		
		state.undo();
		expect(state.objects[0].id).toBe('test_53');
	});

	it('restores seat types and grid dimensions with the layout', () => {
		state.commitHistory();
		state.createSeatType({ name: 'premium', color: '#123456' });
		state.gridWidth = 120;
		state.commitGridDimensionChange();

		state.undo();
		expect(state.gridWidth).toBe(80);
		expect(state.seatTypes.premium?.color).toBe('#123456');
		state.undo();
		expect(state.seatTypes.premium).toBeUndefined();

		state.redo();
		expect(state.seatTypes.premium?.color).toBe('#123456');
		state.redo();
		expect(state.gridWidth).toBe(120);
	});

	it('records seat type edits even when objects do not change', () => {
		state.commitHistory();
		state.createSeatType({ name: 'premium', color: '#123456' });

		state.undo();
		expect(state.seatTypes.premium).toBeUndefined();
		state.redo();
		expect(state.seatTypes.premium?.color).toBe('#123456');
	});

	it('records the final vertex position as one undoable edit', () => {
		state.objects = [{
			id: 'env_poly_1',
			type: 'env-polygon',
			x: 10,
			y: 10,
			width: 40,
			height: 40,
			points: [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 20, y: 40 }],
			metadata: {}
		}];
		state.commitHistory();

		state.addVertexAtMidpoint('env_poly_1', 0, { stopPropagation() {} } as MouseEvent);
		state.objects[0].points![1] = { x: 30, y: 5 };
		state.handleMouseUp({ clientX: 0, clientY: 0 } as MouseEvent);

		expect(state.history).toHaveLength(2);
		state.undo();
		expect(state.objects[0].points).toHaveLength(3);
	});
});