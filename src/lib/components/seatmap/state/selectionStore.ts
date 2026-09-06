import { writable, derived, get } from 'svelte/store';
import { seatmapStore } from './seatmapStore';
import type { SeatMapElement } from '../types';

/** Transient — never exported to the SeatMap JSON. Just the set of currently selected element ids. */
function createSelectionStore() {
	const store = writable<Set<string>>(new Set());

	return {
		subscribe: store.subscribe,

		/** Replace the whole selection (e.g. single click, or the result of a lasso drag). */
		select(ids: string[]) {
			store.set(new Set(ids));
		},

		add(id: string) {
			store.update((s) => new Set(s).add(id));
		},

		addMany(ids: string[]) {
			store.update((s) => {
				const next = new Set(s);
				for (const id of ids) next.add(id);
				return next;
			});
		},

		/** Shift-click behavior. */
		toggle(id: string) {
			store.update((s) => {
				const next = new Set(s);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			});
		},

		remove(id: string) {
			store.update((s) => {
				const next = new Set(s);
				next.delete(id);
				return next;
			});
		},

		clear() {
			store.set(new Set());
		},

		has(id: string): boolean {
			return get(store).has(id);
		},

		/** Synchronous snapshot, for use inside actions.ts rather than subscribing. */
		get(): Set<string> {
			return get(store);
		}
	};
}

export const selectionStore = createSelectionStore();

export const selectedIds = derived(selectionStore, ($s) => Array.from($s));

/** The actual selected elements, kept in sync with both selection changes and document edits (e.g. a delete). */
export const selectedElements = derived(
	[selectionStore, seatmapStore],
	([$selection, $seatmap]): SeatMapElement[] => $seatmap.elements.filter((el) => $selection.has(el.id))
);

export const hasSelection = derived(selectionStore, ($s) => $s.size > 0);
export const selectionCount = derived(selectionStore, ($s) => $s.size);

/** True only when every selected element is a Seat — determines whether the "สถานะ/ลักษณะเก้าอี้" panel shows. */
export const selectionIsAllSeats = derived(selectedElements, ($els) => $els.length > 0 && $els.every((el) => el.type === 'seat'));
