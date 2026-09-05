export type ToolType = 'pointer' | 'box-select' | 'lasso' | 'add-square' | 'add-line' | 'add-array'| 'add-rect';


export interface EnvObject {
	id: string;
	type: 'rect';
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
}

export interface Square {
	id: string;
	x: number;
	y: number;
	rotation?: number; // Rotation in degrees (0 - 360)
}

export interface Point {
	x: number;
	y: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}