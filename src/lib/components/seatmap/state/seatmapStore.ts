import { writable, derived, get } from 'svelte/store';
import type { SeatMap, SeatMapElement } from '../types';
import { createEmptySeatMap } from '../factories';

/**
 * Single source of truth for the document being edited. Kept deliberately
 * thin — raw `set`/`update` plus a `reset` — so every *mutating* action goes
 * through `state/actions.ts` instead, which pairs each mutation with a
 * history checkpoint. Components should generally import from `actions.ts`,
 * not call `seatmapStore.update()` directly, or undo/redo will silently miss
 * that change.
 */
function createSeatmapStore() {
	const store = writable<SeatMap>(createEmptySeatMap('', 'Untitled'));

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		/** Re-initializes with a fresh empty map for a given room (e.g. on route load, before a saved map is fetched and loaded in). */
		reset(roomId: string, name: string) {
			store.set(createEmptySeatMap(roomId, name));
		}
	};
}

export const seatmapStore = createSeatmapStore();

export function getSeatMap(): SeatMap {
	return get(seatmapStore);
}

/** O(1) id -> element lookup, recomputed whenever elements change. Prefer this over `.find()` in hot paths (drag/render). */
export const elementsById = derived(seatmapStore, ($seatmap) => {
	const map = new Map<string, SeatMapElement>();
	for (const el of $seatmap.elements) map.set(el.id, el);
	return map;
});
