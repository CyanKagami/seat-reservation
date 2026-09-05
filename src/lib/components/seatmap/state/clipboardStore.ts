import { writable, get } from 'svelte/store';
import type { SeatMapElement } from '../types';

/**
 * Deliberately an in-memory store, not the real OS clipboard — keeps
 * Ctrl+C/Ctrl+V reliable and JSON-shaped without dealing with the async,
 * permission-gated Clipboard API. Elements are cloned on both write and read
 * so nothing in here is ever the same object reference as what's in
 * `seatmapStore` (accidental shared mutation would otherwise be an easy bug
 * to introduce later).
 */
function createClipboardStore() {
	const store = writable<SeatMapElement[]>([]);

	return {
		subscribe: store.subscribe,
		set(elements: SeatMapElement[]) {
			store.set(structuredClone(elements));
		},
		get(): SeatMapElement[] {
			return structuredClone(get(store));
		},
		isEmpty(): boolean {
			return get(store).length === 0;
		}
	};
}

export const clipboardStore = createClipboardStore();
