export * from '../canvas-shared/types';

export type ToolType = 'pointer' | 'lasso';

export interface ZoneSeatMetadata {
	zone?: string;
	status?: 'available' | 'unavailable' | string;
	row?: string;
	seatNo?: string;
	label?: string;
	isManualLabel?: boolean;
	seatType?: string;
	color?: string;
	[key: string]: any;
}