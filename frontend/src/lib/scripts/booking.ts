// src/lib/booking.ts
// Thin client for /api/booking. Components call these instead of touching fetch directly.
// apiFetch (src/lib/api.ts) prefixes PUBLIC_API_URL (which ends in /api), adds the
// Bearer token, and redirects to /login on a 401.
import { apiFetch, unwrap } from '$lib/scripts/api';
import type { Event } from '$lib/type/event';
import type { Reservation, ReservationView, ReservationWithEvent } from '$lib/type/reservation';
import type { SeatParts } from './seat';

// Registration window = event['register-date'].start / .end.
// Caveat: a value without a timezone (e.g. "2026-10-20T09:00" from a datetime-local
// input) is read in the SERVER's timezone, so store ISO strings with an offset.
export function registrationOpen(ev: Event, now = new Date()) {
  const start = ev['register-date']?.start;
  const end = ev['register-date']?.end;
  if (start && now < new Date(start)) return false;
  if (end && now > new Date(end)) return false;
  return true;
}

// Everyone gets seatId, zone, seat and mine. Admin/organizer also get the full record and the booker.
export type SeatEntry = { seatId: string; zone: string; seat: string; mine: boolean } & Partial<
  Omit<ReservationView, 'seatId' | 'zone' | 'seat'>
> & {
  user?: { name: string; email: string } | null;
};

export interface SeatMap {
  reservations: SeatEntry[];
  myReservation: ReservationView | null;
}

// Thrown for any non-2xx answer; `code` is one of
// SEAT_TAKEN | ALREADY_BOOKED | NOT_FOUND | FORBIDDEN | CONFLICT (when the server sent one).




export async function getSeatMap(eventId: string, fetchFunc: typeof fetch = fetch): Promise<SeatMap> {
  return unwrap(await apiFetch(`/booking?eventId=${encodeURIComponent(eventId)}`, {}, fetchFunc));
}

// seatId is "<zone>-<seat>", e.g. "Front-A5" (build it with makeSeatId from $lib/seat).
export async function reserveSeat(eventId: string, seatId: string, zone: string, fetchFunc: typeof fetch = fetch): Promise<{ reservation: ReservationView }> {
  return unwrap(
    await apiFetch('/booking', {
      method: 'POST',
      body: JSON.stringify({ eventId, seatId: `${zone}-${seatId}` })
    }, fetchFunc)
  );
}

export async function checkInSeat(eventId: string, identifier: string, fetchFunc: typeof fetch = fetch): Promise<Reservation & SeatParts> {
  return unwrap(
    await apiFetch('/booking/check-in', {
      method: 'POST',
      body: JSON.stringify({ eventId, identifier })
    }, fetchFunc)
  )
}

export async function cancelSeat(eventId: string, seatId: string, zone: string, fetchFunc: typeof fetch = fetch): Promise<{ message: string }> {
  return unwrap(
    await apiFetch(
      `/booking?eventId=${encodeURIComponent(eventId)}&seatId=${encodeURIComponent(`${zone}-${seatId}`)}`,
      { method: 'DELETE' },
      fetchFunc
    )
  );
}

// Each reservation carries event: { name, date, picture, place } (null if the event was deleted).
export async function getMyReservations(fetchFunc: typeof fetch = fetch): Promise<{ reservations: ReservationWithEvent[] }> {
  return unwrap(await apiFetch('/booking/mine', {}, fetchFunc));
}

// Each reservation carries event: { name, date, picture, place } (null if the event was deleted).
export async function getEventAttendance(eventId: string, fetchFunc: typeof fetch = fetch): Promise<{ checkInCount: number, totalCount: number }> {
  return unwrap(await apiFetch(`/booking/statistic/attendance?eventId=${encodeURIComponent(eventId)}`, {}, fetchFunc));
}

// Each reservation carries event: { name, date, picture, place } (null if the event was deleted).
export async function getReservation(eventId: string, identifier: string, fetchFunc: typeof fetch = fetch): Promise<(Reservation & SeatParts)> {
  return unwrap(await apiFetch(`/booking/registered?eventId=${encodeURIComponent(eventId)}&identifier=${encodeURIComponent(identifier)}`, {}, fetchFunc));
}

// Each reservation carries event: { name, date, picture, place } (null if the event was deleted).
export async function getReservationStatistic(eventId: string, fetchFunc: typeof fetch = fetch): Promise<({
  zoneData: Record<
    string,
    {
      id: string,
      name: string
      capacity: number;
      takenCount: number;
      isUnavailableZone?: boolean;
      isNoZone?: boolean;
    }
  >,
  totalReservation:number,
  totalCapacity:number,
  remainingCapacity: number,
  checkedInCount:number,
  demographic: {
    mostParticipatedFaculty: {name: string, count:number},
    mostParticipatedYear: {name: string, count:number}
  }
})> {
  return unwrap(await apiFetch(`/booking/statistic/seating?eventId=${encodeURIComponent(eventId)}`, {}, fetchFunc));
}