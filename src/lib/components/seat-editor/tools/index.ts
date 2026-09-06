import type { ToolType } from '../types';
import { BaseToolStrategy } from './BaseToolStrategy';

import { PointerToolStrategy } from './PointerTool';
import { LassoToolStrategy } from './LassoTool';
import { SingleSeatToolStrategy } from './SingleSeatTool';
import { LineToolStrategy } from "./LineTool";
import { ArrayToolStrategy } from './ArrayTool';
import { RectToolStrategy } from './RectTool';
import { CircleToolStrategy } from './CircleTool';
import { PolygonToolStrategy } from './PolygonTool';

export const toolRegistry: Record<ToolType, BaseToolStrategy> = {
	'pointer': new PointerToolStrategy(),
	'lasso': new LassoToolStrategy(),
	'add-square': new SingleSeatToolStrategy(),
	'add-line': new LineToolStrategy(),
	'add-array': new ArrayToolStrategy(),
	'add-rect': new RectToolStrategy(),
	'add-circle': new CircleToolStrategy(),
	'add-polygon': new PolygonToolStrategy()
};

export * from './BaseToolStrategy';
export * from './types';