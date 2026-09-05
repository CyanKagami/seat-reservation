import { getSeatMap } from '../state/seatmapStore';
import { addElement } from '../state/actions';
import { createSeat } from '../factories';

/** Places one seat centered at (x, y) in stage coordinates. Tool stays active after placing — matches typical seat-editor UX of rapid multi-click placement, rather than snapping back to "select" after every seat. */
export function placeSeatAt(x: number, y: number): void {
	const { elements } = getSeatMap();
	addElement(createSeat(x, y, elements));
}
