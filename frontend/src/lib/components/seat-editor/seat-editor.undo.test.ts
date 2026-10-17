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
});