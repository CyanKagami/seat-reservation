import { describe, it, expect, beforeEach } from 'vitest';
import { ArrayToolStrategy } from './tools/ArrayTool';
import { SeatEditorState } from './seatState.svelte';
import { BOX_SIZE, GAP } from './constants';

describe('ArrayTool - Seat Spawning Relative to Starting Position', () => {
	let arrayTool: ArrayToolStrategy;
	let state: SeatEditorState;

	beforeEach(() => {
		arrayTool = new ArrayToolStrategy();
		state = new SeatEditorState('place-1');
		state.panX = 0;
		state.panY = 0;
		state.scale = 1;
		state.gridWidth = 100;
		state.gridHeight = 100;
	});

	it('should spawn seats anchored at start position when dragging top-left to bottom-right', () => {
		const startScreen = { x: 100, y: 100 };
		const endScreen = { x: 170, y: 170 }; // absDx = 70, absDy = 70 -> cols = 2, rows = 2

		const seats = arrayTool.calculateArraySeats(startScreen, endScreen, state);

		expect(seats.length).toBe(4);

		// First seat (r=0, c=0) must be anchored at the exact start position
		expect(seats[0]).toEqual({ x: 100, y: 100 });
		// (r=0, c=1)
		expect(seats[1]).toEqual({ x: 100 + BOX_SIZE + GAP, y: 100 });
		// (r=1, c=0)
		expect(seats[2]).toEqual({ x: 100, y: 100 + BOX_SIZE + GAP });
		// (r=1, c=1)
		expect(seats[3]).toEqual({ x: 100 + BOX_SIZE + GAP, y: 100 + BOX_SIZE + GAP });
	});

	it('should spawn seats anchored at start position when dragging bottom-right to top-left', () => {
		const startScreen = { x: 300, y: 300 };
		const endScreen = { x: 230, y: 230 }; // dx = -70, dy = -70 -> cols = 2, rows = 2

		const seats = arrayTool.calculateArraySeats(startScreen, endScreen, state);

		expect(seats.length).toBe(4);

		// First seat (r=0, c=0) must have its bottom-right corner at the start position (300, 300)
		// which means top-left is (300 - BOX_SIZE, 300 - BOX_SIZE) = (280, 280)
		expect(seats[0]).toEqual({ x: 300 - BOX_SIZE, y: 300 - BOX_SIZE });

		// Further seats expand left and upwards
		const stride = BOX_SIZE + GAP;
		// (r=0, c=1) expands left: 280 - 30 = 250
		expect(seats[1]).toEqual({ x: 300 - BOX_SIZE - stride, y: 300 - BOX_SIZE });
		// (r=1, c=0) expands up: 280 - 30 = 250
		expect(seats[2]).toEqual({ x: 300 - BOX_SIZE, y: 300 - BOX_SIZE - stride });
		// (r=1, c=1)
		expect(seats[3]).toEqual({ x: 300 - BOX_SIZE - stride, y: 300 - BOX_SIZE - stride });
	});

	it('should keep the first seat stationary as user drags further when dragging from bottom-right', () => {
		const startScreen = { x: 300, y: 300 };
		const drag1 = { x: 280, y: 280 }; // smaller drag
		const drag2 = { x: 200, y: 200 }; // larger drag

		const seats1 = arrayTool.calculateArraySeats(startScreen, drag1, state);
		const seats2 = arrayTool.calculateArraySeats(startScreen, drag2, state);

		// The initial seat must remain in the exact same position
		expect(seats1[0]).toEqual({ x: 280, y: 280 });
		expect(seats2[0]).toEqual({ x: 280, y: 280 });
	});

	it('should handle dragging top-right to bottom-left', () => {
		const startScreen = { x: 200, y: 100 };
		const endScreen = { x: 130, y: 170 }; // dx = -70, dy = +70

		const seats = arrayTool.calculateArraySeats(startScreen, endScreen, state);

		expect(seats.length).toBe(4);
		// First seat has top-right corner at (200, 100) -> top-left is (200 - BOX_SIZE, 100)
		expect(seats[0]).toEqual({ x: 200 - BOX_SIZE, y: 100 });
	});

	it('should handle dragging bottom-left to top-right', () => {
		const startScreen = { x: 100, y: 200 };
		const endScreen = { x: 170, y: 130 }; // dx = +70, dy = -70

		const seats = arrayTool.calculateArraySeats(startScreen, endScreen, state);

		expect(seats.length).toBe(4);
		// First seat has bottom-left corner at (100, 200) -> top-left is (100, 200 - BOX_SIZE)
		expect(seats[0]).toEqual({ x: 100, y: 200 - BOX_SIZE });
	});
});
