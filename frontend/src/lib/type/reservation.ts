// src/lib/type/reservation.ts
export type ReservationStatus = 'reserved' | 'checked-in';

export interface Reservation {
  eventId: string;
  seatId: string;
  googleId: string;
  status: ReservationStatus;
  reservedAt: string; // ISO date string
  event?: EventSummary
}
// The few event fields a "my bookings" screen needs, looked up at read time.
export interface EventSummary {
  name: string;
  date?: { start?: string; end?: string };
  picture?: string | null; // image URL, null if the event has none
  place?: { placeId?: string; name?: string } | null;
}

export interface ReservationWithEvent extends Reservation {
  event: EventSummary | null; // null if the event was deleted
}
