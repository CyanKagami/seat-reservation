// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SeatEditorState } from '../seatState.svelte';
import { SvelteSet } from 'svelte/reactivity';

describe('SeatEditorState Unit Tests', () => {
	let state: SeatEditorState;
    
	beforeEach(() => {
		state = new SeatEditorState();
	});

	it('initializes with default seats and selection', () => {
		expect(state.squares.length).toBe(2);
		expect(state.selectedIds.has('s_1')).toBe(true);
	});

	it('adds a new square and sets it as active selection', () => {
		state.addSquare();
		expect(state.squares.length).toBe(3);
		
		const newlyAdded = state.squares[state.squares.length - 1];
		expect(state.selectedIds.has(newlyAdded.id)).toBe(true);
	});

	it('calculates derived overlapping seat IDs correctly', () => {
		state.squares = [
			{ id: 's_1', x: 10, y: 10 },
			{ id: 's_2', x: 12, y: 12 } // Overlaps s_1
		];

		expect(state.overlappingIds.has('s_1')).toBe(true);
		expect(state.overlappingIds.has('s_2')).toBe(true);
	});

	it('copies and pastes selected seats with offset', () => {
		state.selectedIds = new SvelteSet(['s_1']);
		state.copySelected();
		state.pasteSquares();

		expect(state.squares.length).toBe(3);
		const pastedSeat = state.squares[2];
		expect(pastedSeat.x).toBe(state.squares[0].x + 20); // GRID_SIZE * 2
	});

	it('triggers file download stream on JSON export', () => {
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		
		state.exportAsJSON();
		
		expect(URL.createObjectURL).toHaveBeenCalled();
		expect(clickSpy).toHaveBeenCalled();
	});
});