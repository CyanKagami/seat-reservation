// src/lib/seat.ts
// Legacy seat IDs are "<zone>-<seat>"; internal IDs use readable "S-..." or legacy "seatkey_*" forms.
// Pure functions with no server imports, so the same code runs in the browser and on the server.

// Letters (any script, Thai included), combining marks, digits and "_". '#' is never allowed,
// so a client can't forge a key that collides with the internal "USER#..." items.
const WORD = '[\\p{L}\\p{M}\\p{N}_]';

// zone: 1-32 chars, hyphens allowed inside but not at either end
// seat: 1-32 chars, no hyphen (so the greedy zone part backtracks to the last "-")
const SEAT_ID = new RegExp(`^(${WORD}(?:[\\p{L}\\p{M}\\p{N}_-]{0,30}${WORD})?)-(${WORD}{1,32})$`, 'u');
const INTERNAL_SEAT_ID = /^(?:S-[0-9A-HJKMNP-TV-Z]{10}|seatkey_(?:[a-f0-9]{32}|legacy_[a-f0-9]+))$/;

export interface SeatParts {
  zone: string;
  seat: string;
}

export function parseSeatId(seatId: string): SeatParts | null {
  if (INTERNAL_SEAT_ID.test(seatId)) return { zone: '', seat: seatId };
  const match = SEAT_ID.exec(seatId);
  return match ? { zone: match[1], seat: match[2] } : null;
}

// Throws if the seat contains "-": it would silently be read back as part of the zone.
export function makeSeatId(zone: string, seat: string): string {
  const id = `${zone}-${seat}`;
  const parts = parseSeatId(id);
  if (!parts || parts.zone !== zone || parts.seat !== seat) {
    throw new Error(`Invalid zone/seat "${zone}" / "${seat}": the seat must not contain "-"`);
  }
  return id;
}

export function isValidSeatId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && parseSeatId(value) !== null;
}