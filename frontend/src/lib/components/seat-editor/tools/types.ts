import type { SeatEditorState } from '$lib/components/seat-editor/seatState.svelte';
import type { Point } from '../types';

export interface ToolContext {
	state: SeatEditorState;
	event: MouseEvent;
	canvasPoint: Point; // Unscaled grid space coordinate
	screenPoint: Point; // Scaled screen pixel coordinate
}

export interface ToolStrategy {
	id: string;
	onMouseDown?: (ctx: ToolContext) => void;
	onMouseMove?: (ctx: ToolContext) => void;
	onMouseUp?: (ctx: ToolContext) => void;
}