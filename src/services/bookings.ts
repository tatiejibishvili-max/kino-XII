import type { ConfirmedOrder, StoredBooking } from "../types/purchase";

const PREFIX = "kino-xii-booking:";

export function rememberBooking(order: ConfirmedOrder, screening: { movieTitle: string; venueName: string; hall: string; date: string; time: string }): void {
  const booking: StoredBooking = {
    reference: order.reference,
    status: order.status,
    total: order.total,
    movieTitle: order.movieTitle || screening.movieTitle,
    venueName: order.venueName || screening.venueName,
    hall: order.hall || screening.hall,
    date: order.date || screening.date,
    time: order.time || screening.time,
    seats: order.seats.map((seat) => ({ code: seat.code, ticketType: seat.ticketType, price: seat.price })),
    email: order.email,
  };
  try {
    sessionStorage.setItem(`${PREFIX}${order.reference}`, JSON.stringify(booking));
  } catch {
    // The confirmation modal still shows the order returned by the server.
  }
}

export function readBooking(reference: string): StoredBooking | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${reference}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBooking;
    if (!parsed || parsed.reference !== reference || !Array.isArray(parsed.seats)) return null;
    return parsed;
  } catch {
    return null;
  }
}
