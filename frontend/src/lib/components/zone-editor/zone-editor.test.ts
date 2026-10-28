import { describe, it, expect, beforeEach } from 'vitest';
import { ZoneEditorState } from './zoneState.svelte';
import type { CanvasObject } from './types';
import {
	createReservationSeatId,
	ensureReadableReservationSeatIds,
	getLegacySeatIds,
	getReservationSeatId,
	getSeatId
} from './utils/zoneUtils';
import { alertModal } from '$lib/store/alert.svelte';
import { classifyIdentifier } from '$lib/scripts/checkIn';

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

	it('should assign row and seat numbers in a zone row-by-row (top-to-bottom, left-to-right)', () => {
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
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_r1_c1')!)).toBe('A1');

		expect(getMetadata('seat_r1_c2')?.row).toBe('A');
		expect(getMetadata('seat_r1_c2')?.seatNo).toBe('2');
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_r1_c2')!)).toBe('A2');

		// Row 2
		expect(getMetadata('seat_r2_c1')?.row).toBe('B');
		expect(getMetadata('seat_r2_c1')?.seatNo).toBe('1');
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_r2_c2')!)).toBe('B2');
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_r2_c1')!)).toBe('B1');

		expect(getMetadata('seat_r2_c2')?.row).toBe('B');
		expect(getMetadata('seat_r2_c2')?.seatNo).toBe('2');

		// Other zone seat untouched
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_other')!)).toBe('');
	});

	it('should respect manual overrides when overwriteManual is false', () => {
		const seatManual: CanvasObject = {
			id: 'seat_manual',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'CUSTOM', seatNo: '99', isManualLabel: true }
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
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_manual')!)).toBe('CUSTOM99');
		expect(manualMeta?.isManualLabel).toBe(true);

		state.autoLabelZone('VIP', true);
		const overwrittenMeta = state.objects.find((o) => o.id === 'seat_manual')?.metadata;
		expect(getSeatId(state.objects.find((o) => o.id === 'seat_manual')!)).toBe('A1');
		expect(overwrittenMeta?.isManualLabel).toBe(false);
	});

	it('should preserve row and seat number when updating other selected metadata', () => {
		const seat: CanvasObject = {
			id: 'seat_A1',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'A', seatNo: '1' }
		};
		state.objects = [seat];
		state.selectedIds = new Set([seat.id]);

		state.updateSelectedObjectMetadata({ status: 'unavailable' });

		expect(getSeatId(state.objects[0])).toBe('A1');
		expect(state.objects[0].metadata?.status).toBe('unavailable');
	});

	it('clears auto-generated labels when moving a seat to another zone', () => {
		state.objects = [{
			id: 'seat_auto',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'A', seatNo: '1', isManualLabel: false }
		}];
		state.selectedIds = new Set(['seat_auto']);

		state.updateSelectedObjectZone('Regular');

		expect(state.objects[0].metadata.zone).toBe('Regular');
		expect(state.objects[0].metadata.row).toBeUndefined();
		expect(state.objects[0].metadata.seatNo).toBeUndefined();
		expect(state.objects[0].metadata.isManualLabel).toBeUndefined();
		expect(getSeatId(state.objects[0])).toBe('');
	});

	it('preserves manual labels when moving a seat to another zone', () => {
		state.objects = [{
			id: 'seat_manual',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'CUSTOM', seatNo: '9', isManualLabel: true }
		}];
		state.selectedIds = new Set(['seat_manual']);

		state.updateSelectedObjectZone('Regular');

		expect(state.objects[0].metadata.zone).toBe('Regular');
		expect(getSeatId(state.objects[0])).toBe('CUSTOM9');
		expect(state.objects[0].metadata.isManualLabel).toBe(true);
	});

	it('should fall back to a stable internal ID when a seat label is missing', () => {
		const seat: CanvasObject = {
			id: 'seat_internal-id',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { row: 'A' }
		};

		expect(getSeatId(seat)).toBe('');
		expect(getReservationSeatId(seat)).toBe('seatkey_legacy_736561745f696e7465726e616c2d6964');
		seat.metadata!.seatNo = '1';
		expect(getSeatId(seat)).toBe('A1');
	});

	it('should not require a zone or label to validate a reservable seat', () => {
		state.objects = [{
			id: 'seat_unlabeled',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: {}
		}];
		expect(state.seatIdValidation.duplicateSeatIds).toEqual([]);
	});

	it('preserves legacy reservation aliases when loading a layout', () => {
		state.objects = [{
			id: 'seat_old',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'A', seatNo: '1' }
		}];
		const bytes = state.exportToMessagePack();
		state.loadFromMessagePack(new Uint8Array(bytes).buffer);
		const loadedSeat = state.objects[0];

		expect(loadedSeat.metadata.reservationId).toBe(getReservationSeatId(loadedSeat));
		expect(getLegacySeatIds(loadedSeat)).toContain('VIP-A1');
		expect(loadedSeat.metadata.reservationId).toMatch(/^S-[0-9A-HJKMNP-TV-Z]{10}$/);

		loadedSeat.metadata.zone = undefined;
		loadedSeat.metadata.row = undefined;
		loadedSeat.metadata.seatNo = undefined;
		expect(getLegacySeatIds(loadedSeat)).toContain('VIP-A1');
	});

	it('creates distinct internal IDs for newly added seats', () => {
		const first = createReservationSeatId();
		const second = createReservationSeatId();

		expect(first).toMatch(/^S-[0-9A-HJKMNP-TV-Z]{10}$/);
		expect(second).toMatch(/^S-[0-9A-HJKMNP-TV-Z]{10}$/);
		expect(second).not.toBe(first);
	});

	it('migrates existing internal IDs and retains them as reservation aliases', () => {
		const previousId = 'seatkey_0123456789abcdef0123456789abcdef';
		const legacySeat: CanvasObject = {
			id: 'seat_old',
			type: 'seat',
			x: 0,
			y: 0,
			width: 20,
			height: 20,
			metadata: { reservationId: previousId, zone: 'VIP', row: 'A', seatNo: '1' }
		};
		const currentSeat: CanvasObject = {
			id: 'seat_current',
			type: 'seat',
			x: 30,
			y: 0,
			width: 20,
			height: 20,
			metadata: { reservationId: 'S-0123456789' }
		};

		const migrated = ensureReadableReservationSeatIds([legacySeat, currentSeat]);

		expect(getReservationSeatId(migrated[0])).toMatch(/^S-[0-9A-HJKMNP-TV-Z]{10}$/);
		expect(getLegacySeatIds(migrated[0])).toContain(previousId);
		expect(getLegacySeatIds(migrated[0])).toContain('VIP-A1');
		expect(getReservationSeatId(migrated[1])).toBe('S-0123456789');
		expect(getReservationSeatId(migrated[0])).not.toBe(getReservationSeatId(migrated[1]));
	});

	it('classifies readable seat IDs for organizer check-in', () => {
		expect(classifyIdentifier('S-7K2M9W4P3D')).toEqual({
			type: 'SeatId',
			value: 'S-7K2M9W4P3D'
		});
	});

	it('should reject saving when seats have duplicate seat IDs', async () => {
		state.objects = ['seat_1', 'seat_2'].map((id, index) => ({
			id,
			type: 'seat',
			x: index * 30,
			y: 0,
			width: 20,
			height: 20,
			metadata: { zone: 'VIP', row: 'A', seatNo: '1' }
		}));

		await state.uploadToAPI();

		expect(state.isSaving).toBe(false);
		expect(alertModal.title).toBe('ยังบันทึกผังไม่ได้');
		expect(alertModal.message).toContain('A1');
	});
});
