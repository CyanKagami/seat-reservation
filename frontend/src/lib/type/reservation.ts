export interface Reservation {
    eventId: string;
    seatId: string;
    googleId: string;
    status: 'reserved' | 'cancelled' | 'completed';
    reservedAt: string; // ISO date string
}