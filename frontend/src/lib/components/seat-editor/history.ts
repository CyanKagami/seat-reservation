import type { CanvasObject, SeatType } from './types';

export interface LayoutSnapshot {
	objects: CanvasObject[];
	seatTypes: Record<string, SeatType>;
	gridWidth: number;
	gridHeight: number;
}

export function cloneLayoutSnapshot(snapshot: LayoutSnapshot): LayoutSnapshot {
	return JSON.parse(JSON.stringify(snapshot)) as LayoutSnapshot;
}

export function appendLayoutSnapshot(
	history: LayoutSnapshot[],
	historyIndex: number,
	snapshot: LayoutSnapshot,
	maxDepth: number
): { history: LayoutSnapshot[]; historyIndex: number } {
	const current = history[historyIndex];
	if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
		return { history, historyIndex };
	}

	const nextHistory = history.slice(0, historyIndex + 1);
	nextHistory.push(cloneLayoutSnapshot(snapshot));
	if (nextHistory.length > maxDepth) nextHistory.shift();

	return { history: nextHistory, historyIndex: nextHistory.length - 1 };
}
