import type { ZoneEditorState } from '$lib/components/zone-editor/zoneState.svelte';
import type { Point } from '../types';

export interface ToolContext {
	state: ZoneEditorState;
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