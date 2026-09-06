import { nanoid } from 'nanoid';
import { seatmapStore, getSeatMap } from './seatmapStore';
import { selectionStore } from './selectionStore';
import { historyStore } from './historyStore';
import { clipboardStore } from './clipboardStore';
import type { SeatMap, SeatMapElement, SeatType, CanvasConfig } from '../types';

/**
 * Every function in this file is the one and only path components/canvas
 * code should use to mutate the document. Each wraps its change with a
 * history checkpoint via `withHistory`, so `historyStore`'s undo/redo stays
 * accurate — bypassing this file (e.g. calling `seatmapStore.update()`
 * directly) will make a change that Ctrl+Z can't see.
 */
function withHistory(mutate: (map: SeatMap) => SeatMap): void {
	const before = getSeatMap();
	historyStore.record(before);
	seatmapStore.set(mutate(before));
}

function touch(map: SeatMap): SeatMap {
	return { ...map, updatedAt: new Date().toISOString() };
}

/** ---------- Elements ---------- */

export function addElement(element: SeatMapElement): void {
	withHistory((map) => touch({ ...map, elements: [...map.elements, element] }));
}

export function addElements(elements: SeatMapElement[]): void {
	if (elements.length === 0) return;
	withHistory((map) => touch({ ...map, elements: [...map.elements, ...elements] }));
}

/** Shallow-merge a patch into one element. */
export function updateElement(id: string, patch: Partial<SeatMapElement>): void {
	withHistory((map) =>
		touch({
			...map,
			elements: map.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as SeatMapElement) : el))
		})
	);
}

/**
 * Per-element patches in one history step — the shape a multi-select
 * drag/rotate ends with (each element moved/rotated to its own resulting
 * x/y/rotation), rather than one step per element.
 */
export function updateElements(patches: Map<string, Partial<SeatMapElement>>): void {
	if (patches.size === 0) return;
	withHistory((map) =>
		touch({
			...map,
			elements: map.elements.map((el) => {
				const patch = patches.get(el.id);
				return patch ? ({ ...el, ...patch } as SeatMapElement) : el;
			})
		})
	);
}

/** The same patch applied to every id — e.g. bulk-assign "สถานะ/ลักษณะเก้าอี้" (status/seat type) to a selection. */
export function updateElementsUniform(ids: string[], patch: Partial<SeatMapElement>): void {
	if (ids.length === 0) return;
	const idSet = new Set(ids);
	withHistory((map) =>
		touch({
			...map,
			elements: map.elements.map((el) => (idSet.has(el.id) ? ({ ...el, ...patch } as SeatMapElement) : el))
		})
	);
}

export function removeElements(ids: string[]): void {
	if (ids.length === 0) return;
	const idSet = new Set(ids);
	withHistory((map) => touch({ ...map, elements: map.elements.filter((el) => !idSet.has(el.id)) }));
	selectionStore.clear();
}

export function deleteSelection(): void {
	removeElements(Array.from(selectionStore.get()));
}

/** ---------- Canvas ---------- */

export function setCanvasSize(width: number, height: number): void {
	withHistory((map) => touch({ ...map, canvas: { ...map.canvas, width, height } }));
}

export function updateCanvasConfig(patch: Partial<CanvasConfig>): void {
	withHistory((map) => touch({ ...map, canvas: { ...map.canvas, ...patch } }));
}

/** ---------- Seat types ("ลักษณะเก้าอี้") ---------- */

export function addSeatType(seatType: SeatType): void {
	withHistory((map) => touch({ ...map, seatTypes: [...map.seatTypes, seatType] }));
}

export function updateSeatType(id: string, patch: Partial<SeatType>): void {
	withHistory((map) => touch({ ...map, seatTypes: map.seatTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
}

/** Removing a seat type clears it off any seat referencing it, rather than leaving a dangling id behind. */
export function removeSeatType(id: string): void {
	withHistory((map) =>
		touch({
			...map,
			seatTypes: map.seatTypes.filter((t) => t.id !== id),
			elements: map.elements.map((el) => (el.type === 'seat' && el.seatTypeId === id ? { ...el, seatTypeId: null } : el))
		})
	);
}

/** ---------- Clipboard ---------- */

const PASTE_OFFSET = 20;

export function copySelection(): void {
	const ids = selectionStore.get();
	if (ids.size === 0) return;
	clipboardStore.set(getSeatMap().elements.filter((el) => ids.has(el.id)));
}

/** Pastes the clipboard offset from the originals, with fresh ids, and selects the new copies. */
export function pasteClipboard(): void {
	const clipped = clipboardStore.get();
	if (clipped.length === 0) return;

	const idMap = new Map<string, string>();
	for (const el of clipped) idMap.set(el.id, nanoid());

	const pasted = clipped.map((el): SeatMapElement => {
		const base = { ...el, id: idMap.get(el.id)!, x: el.x + PASTE_OFFSET, y: el.y + PASTE_OFFSET };

		// Only re-point group membership at the pasted group's new id if that
		// group was copied too; otherwise drop it rather than silently attach
		// the pasted seat to an unrelated, un-copied original group.
		if (base.type === 'seat') {
			return { ...base, groupId: base.groupId ? (idMap.get(base.groupId) ?? null) : null };
		}
		if (base.type === 'group') {
			return { ...base, childIds: base.childIds.map((cid) => idMap.get(cid)).filter((id): id is string => !!id) };
		}
		return base;
	});

	addElements(pasted);
	selectionStore.select(pasted.map((el) => el.id));
}

/** ---------- Undo / redo ---------- */

export function undo(): void {
	historyStore.undo();
}

export function redo(): void {
	historyStore.redo();
}
