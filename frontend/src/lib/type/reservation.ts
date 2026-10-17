// src/lib/type/reservation.ts
export type ReservationStatus = 'reserved' | 'checked-in';

export interface Reservation {
  eventId: string;
  seatId: string;
  googleId: string;
  status: ReservationStatus;
  reservedAt: string; // ISO date string
}