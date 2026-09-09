import type { ToolType } from '../types';
import { BaseToolStrategy } from './BaseToolStrategy';

import { PointerToolStrategy } from './PointerTool';
import { LassoToolStrategy } from './LassoTool';
import { PolygonToolStrategy } from './PolygonTool';

export const toolRegistry: Record<ToolType, BaseToolStrategy> = {
	'pointer': new PointerToolStrategy(),
	'lasso': new LassoToolStrategy(),
	'add-polygon': new PolygonToolStrategy()
};

export * from './BaseToolStrategy';
export * from './types';