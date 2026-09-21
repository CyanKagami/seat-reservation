import type { ToolType } from '../types';
import { BaseToolStrategy } from './BaseToolStrategy';

import { PointerToolStrategy } from './PointerTool';
import { LassoToolStrategy } from './LassoTool';

export const toolRegistry: Record<ToolType, BaseToolStrategy> = {
	'pointer': new PointerToolStrategy(),
	'lasso': new LassoToolStrategy(),
};

export * from './BaseToolStrategy';
export * from './types';