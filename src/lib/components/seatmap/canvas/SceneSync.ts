import Konva from 'konva';
import type { Seat } from '../types';
import { createSeatNode, updateSeatNode } from './SeatRenderer';

export interface SeatsSync {
	/** Call with the current full list of seats whenever it changes. Diffs by id — existing nodes are mutated in place, only true adds/removes touch the Konva tree. */
	sync(seats: Seat[]): void;
	destroy(): void;
}

/**
 * Owns the id -> Konva.Group map for the seats layer. This is what keeps
 * things fast at 1000+ seats: a store update (e.g. one seat's status
 * changed) does an O(n) scan to find that one seat, but only that seat's
 * node gets touched — nothing is destroyed/recreated wholesale, and
 * `layer.batchDraw()` is called once per sync, not once per seat.
 */
export function createSeatsSync(layer: Konva.Layer): SeatsSync {
	const nodes = new Map<string, Konva.Group>();

	function sync(seats: Seat[]): void {
		const seen = new Set<string>();

		for (const seat of seats) {
			seen.add(seat.id);
			const existing = nodes.get(seat.id);
			if (existing) {
				updateSeatNode(existing, seat);
			} else {
				const node = createSeatNode(seat);
				nodes.set(seat.id, node);
				layer.add(node);
			}
		}

		for (const [id, node] of nodes) {
			if (!seen.has(id)) {
				node.destroy();
				nodes.delete(id);
			}
		}

		layer.batchDraw();
	}

	function destroy(): void {
		for (const node of nodes.values()) node.destroy();
		nodes.clear();
	}

	return { sync, destroy };
}
