export type ToolType = 'pointer' | 'lasso' | 'add-square' | 'add-line' | 'add-array'| 'add-rect' | 'add-circle' | 'add-polygon';
export type ObjectType = 'seat' | 'env-rect' | 'env-circle' | 'env-polygon' | 'env-icon-polygon';

export interface CanvasObject {
	id: string;
	type: ObjectType;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
	points?:Point[];
	iconType?: string;
	label?: string;
	metadata:{
		[key: string]: any;
	}
}

export interface SeatMetadata {
  zone: string;       // "Z1"
  status: string;     // "available" (User customizable)
  characteristic: string; // "Sofa" (Seat characteristic, User customizable)
  row: string;        // "A" (User customizable)
  seatNo: string;     // "12" (User customizable)
  label: string;      // "A12" or "Z1-A12"
  isManualRow?: boolean; // Flag if user explicitly locked this row
}

export interface EnvironmentMetadata {
	color: string;      // "#FF0000"
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