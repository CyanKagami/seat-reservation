// src/lib/type/reservation.ts
export type ReservationStatus = 'reserved' | 'checked-in';

// The record as stored. seatId is "<zone>-<seat>" (see $lib/seat.ts).
export interface Reservation {
  eventId: string;
  seatId: string;
  email: string;
  googleId?: string;
  status: ReservationStatus;
  reservedAt: string; // ISO date string
  reservedSeatId?: string;
}

// What the API returns: the stored record plus zone/seat extracted from seatId by the server.
export interface ReservationView extends Reservation {
  zone: string;
  seat: string;
}

// The few event fields a "my bookings" screen needs, looked up at read time.
export interface EventSummary {
  name: string;
  date?: { start?: string; end?: string };
  picture?: string | null; // image URL, null if the event has none
  place?: { placeId?: string; name?: string } | null;
}

export interface ReservationWithEvent extends ReservationView {
  event: EventSummary | null; // null if the event was deleted
}