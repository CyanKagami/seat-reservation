import { describe, it, expect, beforeEach } from 'vitest';
import { ZoneEditorState } from './zoneState.svelte';
import type { CanvasObject } from './types';

describe('ZoneEditorState - Seat Status and Labeling', () => {
	let state: ZoneEditorState;

	beforeEach(() => {
		state = new ZoneEditorState('loc-1', 'event-1');
		state.createZone({ name: 'VIP', color: '#ff0000' });
		state.createZone({ name: 'Regular', color: '#0000ff' });
	});

	it('should update seat status for selected seats', () => {
		const seat1: CanvasObject = {
			id: 'seat_1',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', status: 'available' }
		};
		const seat2: CanvasObject = {
			id: 'seat_2',
			type: 'seat',
			x: 30,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', status: 'available' }
		};
		state.objects = [seat1, seat2];
		state.selectedIds = new Set(['seat_1']);

		state.updateSelectedObjectMetadata({ status: 'unavailable' });

		expect(state.objects.find((o) => o.id === 'seat_1')?.metadata?.status).toBe('unavailable');
		expect(state.objects.find((o) => o.id === 'seat_2')?.metadata?.status).toBe('available');
	});

	it('should auto-label seats in a zone row-by-row (top-to-bottom, left-to-right)', () => {
		const seatR1C2: CanvasObject = {
			id: 'seat_r1_c2',
			type: 'seat',
			x: 40,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP' }
		};
		const seatR1C1: CanvasObject = {
			id: 'seat_r1_c1',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP' }
		};
		const seatR2C1: CanvasObject = {
			id: 'seat_r2_c1',
			type: 'seat',
			x: 0,
			y: 30,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP' }
		};
		const seatR2C2: CanvasObject = {
			id: 'seat_r2_c2',
			type: 'seat',
			x: 40,
			y: 30,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP' }
		};
		const otherSeat: CanvasObject = {
			id: 'seat_other',
			type: 'seat',
			x: 0,
			y: 60,
			width: 20,
			height: 20,
			metadata: { zone: 'Regular' }
		};

		state.objects = [seatR1C2, seatR1C1, seatR2C2, seatR2C1, otherSeat];

		state.autoLabelZone('VIP');

		const getMetadata = (id: string) => state.objects.find((o) => o.id === id)?.metadata;

		// Row 1
		expect(getMetadata('seat_r1_c1')?.row).toBe('A');
		expect(getMetadata('seat_r1_c1')?.seatNo).toBe('1');
		expect(getMetadata('seat_r1_c1')?.label).toBe('A1');

		expect(getMetadata('seat_r1_c2')?.row).toBe('A');
		expect(getMetadata('seat_r1_c2')?.seatNo).toBe('2');
		expect(getMetadata('seat_r1_c2')?.label).toBe('A2');

		// Row 2
		expect(getMetadata('seat_r2_c1')?.row).toBe('B');
		expect(getMetadata('seat_r2_c1')?.seatNo).toBe('1');
		expect(getMetadata('seat_r2_c1')?.label).toBe('B1');

		expect(getMetadata('seat_r2_c2')?.row).toBe('B');
		expect(getMetadata('seat_r2_c2')?.seatNo).toBe('2');
		expect(getMetadata('seat_r2_c2')?.label).toBe('B2');

		// Other zone seat untouched
		expect(getMetadata('seat_other')?.label).toBeUndefined();
	});

	it('should respect manual overrides when overwriteManual is false', () => {
		const seatManual: CanvasObject = {
			id: 'seat_manual',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'CUSTOM', seatNo: '99', label: 'CUSTOM99', isManualLabel: true }
		};
		const seatAuto: CanvasObject = {
			id: 'seat_auto',
			type: 'seat',
			x: 40,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP' }
		};

		state.objects = [seatManual, seatAuto];

		state.autoLabelZone('VIP', false);

		const manualMeta = state.objects.find((o) => o.id === 'seat_manual')?.metadata;
		expect(manualMeta?.label).toBe('CUSTOM99');
		expect(manualMeta?.isManualLabel).toBe(true);

		state.autoLabelZone('VIP', true);
		const overwrittenMeta = state.objects.find((o) => o.id === 'seat_manual')?.metadata;
		expect(overwrittenMeta?.label).toBe('A1');
		expect(overwrittenMeta?.isManualLabel).toBe(false);
	});
});
