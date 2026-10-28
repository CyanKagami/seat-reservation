import { decode, encode } from '@msgpack/msgpack';
import type { CanvasObject, ObjectType, SeatType } from './types';
import type { LayoutSnapshot } from './history';

const OBJECT_TYPES = new Set<ObjectType>([
	'seat',
	'env-rect',
	'env-circle',
	'env-polygon',
	'env-icon-polygon'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPoint(value: unknown): value is { x: number; y: number } {
	return isRecord(value) &&
		typeof value.x === 'number' &&
		Number.isFinite(value.x) &&
		typeof value.y === 'number' &&
		Number.isFinite(value.y);
}

function isCanvasObject(value: unknown): value is CanvasObject {
	if (!isRecord(value)) return false;
	if (typeof value.id !== 'string' || value.id.length === 0) return false;
	if (typeof value.type !== 'string' || !OBJECT_TYPES.has(value.type as ObjectType)) return false;
	if (![value.x, value.y, value.width, value.height].every((field) => typeof field === 'number' && Number.isFinite(field))) return false;
	if ((value.width as number) < 0 || (value.height as number) < 0) return false;
	if (value.rotation !== undefined && !Number.isFinite(value.rotation)) return false;
	if (value.rotationCenter !== undefined && !isPoint(value.rotationCenter)) return false;
	if (value.points !== undefined && (!Array.isArray(value.points) || !value.points.every(isPoint))) return false;
	if (
		(value.type === 'env-polygon' || value.type === 'env-icon-polygon') &&
		(!Array.isArray(value.points) || value.points.length < 3)
	) return false;
	return value.metadata === undefined || isRecord(value.metadata);
}

function isSeatType(value: unknown, key: string): value is SeatType {
	return isRecord(value) &&
		value.name === key &&
		typeof value.color === 'string' &&
		(value.description === undefined || typeof value.description === 'string') &&
		(value.picture === undefined || value.picture === null || typeof value.picture === 'string');
}

export function encodeLayout(snapshot: LayoutSnapshot): Uint8Array {
	return encode({
		version: '1.0',
		timestamp: new Date().toISOString(),
		canvas: { gridWidth: snapshot.gridWidth, gridHeight: snapshot.gridHeight },
		seatTypes: snapshot.seatTypes,
		objects: snapshot.objects
	});
}

export function decodeLayout(buffer: ArrayBuffer): LayoutSnapshot {
	const data: unknown = decode(buffer);
	if (!isRecord(data)) throw new Error('Layout must be an object');

	const canvas = isRecord(data.canvas) ? data.canvas : {};
	const gridWidth = canvas.gridWidth ?? 80;
	const gridHeight = canvas.gridHeight ?? 60;
	if (
		!Number.isInteger(gridWidth) ||
		!Number.isInteger(gridHeight) ||
		(gridWidth as number) < 1 ||
		(gridHeight as number) < 1 ||
		(gridWidth as number) > 3000 ||
		(gridHeight as number) > 3000
	) {
		throw new Error('Layout dimensions are invalid');
	}

	const objects = data.objects ?? [];
	if (!Array.isArray(objects) || !objects.every(isCanvasObject)) {
		throw new Error('Layout objects are invalid');
	}
	const objectIds = objects.map((object) => (object as CanvasObject).id);
	if (new Set(objectIds).size !== objectIds.length) {
		throw new Error('Layout contains duplicate object IDs');
	}

	const seatTypesData = data.seatTypes ?? {};
	if (!isRecord(seatTypesData)) throw new Error('Seat types are invalid');
	const seatTypes: Record<string, SeatType> = {};
	for (const [key, value] of Object.entries(seatTypesData)) {
		if (!isSeatType(value, key)) throw new Error(`Seat type "${key}" is invalid`);
		seatTypes[key] = {
			name: value.name,
			color: value.color,
			description: value.description,
			picture: typeof value.picture === 'string' ? value.picture : undefined
		};
	}
	if (!seatTypes.standard) {
		seatTypes.standard = { name: 'standard', color: '#e2e8f0', description: 'Standard seat' };
	}

	return {
		objects: objects.map((object) => ({
			...(object as CanvasObject),
			metadata: (object as CanvasObject).metadata ?? {}
		})),
		seatTypes,
		gridWidth: gridWidth as number,
		gridHeight: gridHeight as number
	};
}
