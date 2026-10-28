// src/lib/type/reservation.ts
export type ReservationStatus = 'reserved' | 'checked-in';

// seatId is the opaque internal seat key; zone/seat are presentation values.
export interface Reservation {
  eventId: string;
  seatId: string;
  email: string;
  googleId?: string;
  status: ReservationStatus;
  reservedAt: string; // ISO date string
  reservedSeatId?: string;
}

// What the API returns: the stored record plus display values from the event layout.
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
  checkInSeatId: string;
  event: EventSummary | null; // null if the event was deleted
}