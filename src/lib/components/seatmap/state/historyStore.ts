import { writable, derived, get } from 'svelte/store';
import { seatmapStore } from './seatmapStore';
import { HISTORY_MAX_DEPTH } from '../constants';
import type { SeatMap } from '../types';

/**
 * Undo-relevant slice of SeatMap — deliberately excludes `id`/`roomId`/`name`/
 * `version`/timestamps, since those are document metadata, not something a
 * `Ctrl+Z` should ever touch.
 */
type Snapshot = Pick<SeatMap, 'canvas' | 'seatTypes' | 'elements'>;

/**
 * Snapshot-based (rather than a hand-rolled do/undo command per action type):
 * every checkpoint is a structuredClone of the undo-relevant state. Simpler
 * to get correct than command objects, and at ~1000 seats x 48 steps the
 * memory footprint (a few MB at most, since seats are small flat objects)
 * is a non-issue — trade a little memory for a lot less bug surface.
 */
function snapshotOf(map: SeatMap): Snapshot {
	return structuredClone({
		canvas: map.canvas,
		seatTypes: map.seatTypes,
		elements: map.elements
	});
}

function applySnapshot(snapshot: Snapshot) {
	seatmapStore.update((map) => ({ ...map, ...structuredClone(snapshot) }));
}

function capped<T>(stack: T[]): T[] {
	return stack.length > HISTORY_MAX_DEPTH ? stack.slice(stack.length - HISTORY_MAX_DEPTH) : stack;
}

function createHistoryStore() {
	const past = writable<Snapshot[]>([]);
	const future = writable<Snapshot[]>([]);

	/**
	 * Call BEFORE applying a mutation, passing the pre-mutation SeatMap, so it
	 * can be restored on undo. Clears the redo stack — a fresh edit
	 * invalidates whatever had previously been undone. In this codebase this
	 * is called exclusively from `actions.ts`'s `withHistory()` wrapper, not
	 * ad hoc from components.
	 */
	function record(preMutationState: SeatMap) {
		past.update((stack) => capped([...stack, snapshotOf(preMutationState)]));
		future.set([]);
	}

	function undo() {
		const pastStack = get(past);
		if (pastStack.length === 0) return;

		const previous = pastStack[pastStack.length - 1];
		const current = snapshotOf(get(seatmapStore));

		past.set(pastStack.slice(0, -1));
		future.update((stack) => [...stack, current]);
		applySnapshot(previous);
	}

	function redo() {
		const futureStack = get(future);
		if (futureStack.length === 0) return;

		const next = futureStack[futureStack.length - 1];
		const current = snapshotOf(get(seatmapStore));

		future.set(futureStack.slice(0, -1));
		past.update((stack) => capped([...stack, current]));
		applySnapshot(next);
	}

	/** Call after loading/importing a map, or on explicit Save if you don't want prior edits undoable past that point. */
	function clear() {
		past.set([]);
		future.set([]);
	}

	return {
		record,
		undo,
		redo,
		clear,
		canUndo: derived(past, ($p) => $p.length > 0),
		canRedo: derived(future, ($f) => $f.length > 0)
	};
}

export const historyStore = createHistoryStore();
