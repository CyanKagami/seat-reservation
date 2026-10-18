// src/lib/booking.ts
// Thin client for /api/booking. Components call these instead of touching fetch directly.
// apiFetch (src/lib/api.ts) prefixes PUBLIC_API_URL (which ends in /api), adds the
// Bearer token, and redirects to /login on a 401.
import { apiFetch } from '$lib/scripts/api';
import type { Reservation } from '$lib/type/reservation';

// Everyone gets seatId + mine. Admin/organizer also get the full record and the booker.
export type SeatEntry = { seatId: string; mine: boolean } & Partial<Omit<Reservation, 'seatId'>> & {
    user?: { name: string; email: string } | null;
  };

export interface SeatMap {
  reservations: SeatEntry[];
  myReservation: Reservation | null;
}

// Thrown for any non-2xx answer; `code` is one of
// SEAT_TAKEN | ALREADY_BOOKED | NOT_FOUND | FORBIDDEN | CONFLICT (when the server sent one).
export class BookingApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Success bodies look like { body: ... }, errors like { error, code? }.
async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BookingApiError(data.error ?? 'Request failed', res.status, data.code);
  }
  return data.body as T;
}

export async function getSeatMap(eventId: string): Promise<SeatMap> {
  return unwrap(await apiFetch(`/booking?eventId=${encodeURIComponent(eventId)}`));
}

export async function reserveSeat(eventId: string, seatId: string): Promise<{ reservation: Reservation }> {
  return unwrap(
    await apiFetch('/booking', {
      method: 'POST',
      body: JSON.stringify({ eventId, seatId })
    })
  );
}

export async function cancelSeat(eventId: string, seatId: string): Promise<{ message: string }> {
  return unwrap(
    await apiFetch(
      `/booking?eventId=${encodeURIComponent(eventId)}&seatId=${encodeURIComponent(seatId)}`,
      { method: 'DELETE' }
    )
  );
}

export async function getMyReservations(): Promise<{ reservations: Reservation[] }> {
  return unwrap(await apiFetch('/booking/mine'));
}