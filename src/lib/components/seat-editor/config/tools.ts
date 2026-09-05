import type { ToolType } from '$lib/components/seat-editor/types';

export interface ToolConfig {
	id: ToolType;
	label: string;
	shortcut?: string;
	category: 'select' | 'create';
	icon: 'pointer' | 'box-select' | 'lasso' | 'add-square' | 'add-line' | 'add-array' | 'add-rect';
}

export const TOOLS: ToolConfig[] = [
	{ id: 'pointer', label: 'Select / Move', shortcut: 'V', category: 'select', icon: 'pointer' },
	{ id: 'box-select', label: 'Box Select', shortcut: 'B', category: 'select', icon: 'box-select' },
	{ id: 'lasso', label: 'Lasso Select', shortcut: 'L', category: 'select', icon: 'lasso' },
	{ id: 'add-square', label: 'Add Single Seat', shortcut: 'S', category: 'create', icon: 'add-square' },
	{ id: 'add-line', label: 'Add Seat Line', shortcut: 'I', category: 'create', icon: 'add-line' },
	{ id: 'add-array', label: 'Add 2D Seat Block', shortcut: 'A', category: 'create', icon: 'add-array' },
	{ id: 'add-rect', label: 'Add Env Rectangle', shortcut: 'R', category: 'create', icon: 'add-rect' }
];