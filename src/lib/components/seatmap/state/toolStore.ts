import { writable } from 'svelte/store';
import type { IconType } from '../types';

export type Tool =
	| 'select'
	| 'lasso-select'
	| 'add-seat'
	| 'add-seat-line'
	| 'add-seat-grid'
	| 'draw-rect'
	| 'draw-circle'
	| 'draw-polygon'
	| 'add-icon'
	| 'add-text';

function createToolStore() {
	const store = writable<Tool>('select');

	return {
		subscribe: store.subscribe,
		set: store.set,
		/** Back to the default pointer/select tool — call after a placement/draw action completes. */
		reset() {
			store.set('select');
		}
	};
}

export const toolStore = createToolStore();

/**
 * Which palette icon (restroom/door/stage) is about to be placed. Set this
 * alongside `toolStore.set('add-icon')` when the user picks a palette item —
 * either by clicking it (click-to-place) or starting a drag (drag-and-drop),
 * so the canvas layer knows which `IconType` to stamp down on click/drop.
 */
export const pendingIconType = writable<IconType | null>(null);
