// layers/shared/seat.js
// Legacy seat IDs use "<zone>-<seat>"; readable internal IDs use "S-..." and older ones use "seatkey_*".
// zone: 1-32 chars, hyphens allowed inside but not at either end.
// seat: 1-32 chars, no hyphen.
// '#' is never allowed — prevents collision with "USER#..." slot keys.

const WORD = '[\\p{L}\\p{M}\\p{N}_]';
const SEAT_ID = new RegExp(
  `^(${WORD}(?:[\\p{L}\\p{M}\\p{N}_-]{0,30}${WORD})?)-(${WORD}{1,32})$`,
  'u'
);
const INTERNAL_SEAT_ID = /^(?:S-[0-9A-HJKMNP-TV-Z]{10}|seatkey_(?:[a-f0-9]{32}|legacy_[a-f0-9]+))$/;

export function parseSeatId(seatId) {
  if (typeof seatId === 'string' && INTERNAL_SEAT_ID.test(seatId)) {
    return { zone: '', seat: seatId };
  }
  const match = SEAT_ID.exec(seatId);
  return match ? { zone: match[1], seat: match[2] } : null;
}

export function makeSeatId(zone, seat) {
  const id = `${zone}-${seat}`;
  const parts = parseSeatId(id);
  if (!parts || parts.zone !== zone || parts.seat !== seat) {
    throw new Error(`Invalid zone/seat "${zone}" / "${seat}": the seat must not contain "-"`);
  }
  return id;
}

export function isValidSeatId(value) {
  return typeof value === 'string' && value.length <= 64 && parseSeatId(value) !== null;
}

export function isInternalSeatId(value) {
  return typeof value === 'string' && INTERNAL_SEAT_ID.test(value);
}

export function getReservationSeatId(object) {
  const storedId = object?.metadata?.reservationId;
  if (isInternalSeatId(storedId)) return storedId;
  if (typeof object?.id !== 'string' || object.id.length === 0) return '';
  return `seatkey_legacy_${Buffer.from(object.id, 'utf8').toString('hex')}`;
}

export function getSeatLabel(object) {
  const row = object?.metadata?.row?.trim() ?? '';
  const seatNo = object?.metadata?.seatNo?.trim() ?? '';
  if (row && seatNo) return `${row}${seatNo}`;
  return object?.metadata?.label?.trim() || object?.label?.trim() || '';
}

export function getLegacySeatIds(object) {
  const storedIds = Array.isArray(object?.metadata?.legacyReservationIds)
    ? object.metadata.legacyReservationIds.filter((id) => typeof id === 'string')
    : [];
  const zone = typeof object?.metadata?.zone === 'string' ? object.metadata.zone : '';
  const label = getSeatLabel(object);
  return [...new Set([...storedIds, ...(zone && label ? [`${zone}-${label}`] : [])])];
}
