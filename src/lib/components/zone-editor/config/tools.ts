import type { ToolType } from '$lib/components/zone-editor/types';

export interface ToolConfig {
	id: ToolType;
	label: string;
	shortcut?: string;
	category: 'select' | 'create';
	icon: 'pointer' | 'lasso';
}

export const TOOLS: ToolConfig[] = [
	{ id: 'pointer', label: 'Select / Move', shortcut: 'V', category: 'select', icon: 'pointer' },
	{ id: 'lasso', label: 'Lasso Select', shortcut: 'L', category: 'select', icon: 'lasso' },
];