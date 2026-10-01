export type ObjectType = 'seat' | 'env-rect' | 'env-circle' | 'env-polygon' | 'env-icon-polygon';

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

export interface CanvasObject {
	id: string;
	type: ObjectType;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
	points?: Point[];
	iconType?: string;
	label?: string;
	metadata: {
		[key: string]: any;
	}
}

export interface SeatType {
	readonly name: string;
	readonly description?: string;
	readonly color: string;
	readonly picture?: string;
}

export interface Zone {
	color: string;
}
