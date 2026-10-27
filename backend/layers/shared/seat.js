// layers/shared/seat.js
// seatId format: "<zone>-<seat>", split at the LAST hyphen.
// zone: 1-32 chars, hyphens allowed inside but not at either end.
// seat: 1-32 chars, no hyphen.
// '#' is never allowed — prevents collision with "USER#..." slot keys.

const WORD = '[\\p{L}\\p{M}\\p{N}_]';
const SEAT_ID = new RegExp(
  `^(${WORD}(?:[\\p{L}\\p{M}\\p{N}_-]{0,30}${WORD})?)-(${WORD}{1,32})$`,
  'u'
);

export function parseSeatId(seatId) {
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
