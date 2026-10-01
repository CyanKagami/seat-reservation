export * from '../canvas-shared/types';

export type ToolType = 'pointer' | 'lasso' | 'add-square' | 'add-line' | 'add-array' | 'add-rect' | 'add-circle' | 'add-polygon';

export interface SeatMetadata {
  zone: string;       // "Z1"
  status: string;     // "available" (User customizable)
  seatType: string; // "Sofa" (Seat characteristic, User customizable)
  row: string;        // "A" (User customizable)
  seatNo: string;     // "12" (User customizable)
  label: string;      // "A12" or "Z1-A12"
  isManualRow?: boolean; // Flag if user explicitly locked this row
}

export interface EnvironmentMetadata {
	color: string;      // "#FF0000"
}