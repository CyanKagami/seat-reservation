import { describe, expect, it } from 'vitest';
import { decodeLayout, encodeLayout } from './layout';
import type { LayoutSnapshot } from './history';

const validLayout: LayoutSnapshot = {
	gridWidth: 80,
	gridHeight: 60,
	seatTypes: {
		standard: { name: 'standard', color: '#e2e8f0' }
	},
	objects: [
		{
			id: 'seat_1',
			type: 'seat',
			x: 10,
			y: 20,
			width: 20,
			height: 20,
			metadata: { seatType: 'standard' }
		}
	]
};

describe('layout serialization', () => {
	it('round trips a valid layout document', () => {
		const buffer = encodeLayout(validLayout);
		const decoded = decodeLayout(buffer.slice().buffer as ArrayBuffer);

		expect(decoded).toEqual(validLayout);
	});

	it('rejects duplicate object IDs before applying a layout', () => {
		const layout = {
			...validLayout,
			objects: [validLayout.objects[0], { ...validLayout.objects[0] }]
		};

		expect(() => decodeLayout(encodeLayout(layout).slice().buffer as ArrayBuffer)).toThrow(/duplicate object IDs/);
	});
});
