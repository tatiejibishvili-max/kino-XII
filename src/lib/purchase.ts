import { purchaseRestriction } from "./age";
import type { HallMap, HallSeat, SelectedSeat, TicketType } from "../types/purchase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GEORGIAN_MOBILE = /^(?:\+995|995|0)?5\d{8}$/;

export function ticketRate(ticketType: TicketType): number {
  if (ticketType === "child") return 0.6;
  if (ticketType === "student") return 0.75;
  return 1;
}

/** Currency is rounded half-up to the tetri (two decimal places). */
export function ticketPrice(basePrice: number, ticketType: TicketType): number {
  return Math.round(basePrice * ticketRate(ticketType) * 100) / 100;
}

export function formatLari(amount: number): string {
  return `₾${amount.toFixed(2)}`;
}

export function seatAmount(seat: SelectedSeat): number {
  return seat.linePrice ?? ticketPrice(seat.basePrice, seat.ticketType);
}

export function subtotal(seats: SelectedSeat[]): number {
  const tetri = seats.reduce((sum, seat) => sum + Math.round(seatAmount(seat) * 100), 0);
  return tetri / 100;
}

export function childTicketsBlocked(ageRating: string): boolean {
  return ageRating.startsWith("16") || ageRating.startsWith("18");
}

export function toggleSeat(
  selected: SelectedSeat[],
  seat: HallSeat,
): { selected: SelectedSeat[]; message: string | null } {
  if (seat.status !== "available") return { selected, message: null };
  if (!Number.isFinite(seat.price)) {
    return { selected, message: `${seat.code} has no price from the booking service.` };
  }
  if (selected.some((item) => item.seatId === seat.id)) {
    return { selected: selected.filter((item) => item.seatId !== seat.id), message: null };
  }
  if (selected.length >= 3) {
    return { selected, message: "You can select up to 3 seats per order." };
  }
  return {
    message: null,
    selected: [
      ...selected,
      {
        seatId: seat.id,
        code: seat.code,
        seatType: seat.type ?? "Standard",
        ticketType: "adult",
        basePrice: seat.price as number,
      },
    ],
  };
}

export function changeTicketType(selected: SelectedSeat[], seatId: string, ticketType: TicketType): SelectedSeat[] {
  return selected.map((seat) => (seat.seatId === seatId ? { ...seat, ticketType } : seat));
}

export interface SeatViolation {
  seatId: string;
  code: string;
  reason: string;
}

export function ticketViolations(selected: SelectedSeat[], ageRating: string): SeatViolation[] {
  if (!childTicketsBlocked(ageRating)) return [];
  return selected
    .filter((seat) => seat.ticketType === "child")
    .map((seat) => ({
      seatId: seat.seatId,
      code: seat.code,
      reason: "Child tickets are not available for this film.",
    }));
}

export function seatsById(map: HallMap): Map<string, HallSeat> {
  const index = new Map<string, HallSeat>();
  for (const section of map.sections) {
    for (const row of section.rows) {
      for (const seat of row.seats) index.set(seat.id, seat);
    }
  }
  return index;
}

export function availabilityViolations(selected: SelectedSeat[], map: HallMap): SeatViolation[] {
  const index = seatsById(map);
  return selected.flatMap((seat) => {
    const current = index.get(seat.seatId);
    if (current?.status === "available") return [];
    return [{ seatId: seat.seatId, code: seat.code, reason: "This seat is no longer available." }];
  });
}

export function removeLostSeats(selected: SelectedSeat[], lostSeatIds: string[]): { kept: SelectedSeat[]; removed: SelectedSeat[] } {
  const lost = new Set(lostSeatIds);
  const matches = (seat: SelectedSeat) => lost.has(seat.seatId) || lost.has(seat.code);
  return {
    kept: selected.filter((seat) => !matches(seat)),
    removed: selected.filter(matches),
  };
}

export function purchaseAgeBlock(ageRating: string, dateOfBirth: string | null, today = new Date()): string | null {
  return purchaseRestriction(ageRating, dateOfBirth, today);
}

export function profileBlock(profileComplete: boolean | null): string | null {
  if (profileComplete === true) return null;
  if (profileComplete === false) return "Complete your profile before buying tickets.";
  return "Purchase cannot start because the account service has not confirmed this profile is complete.";
}

export function validateBuyer(buyer: { fullName: string; email: string; mobile: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (buyer.fullName.trim().length < 3) errors.fullName = "Full name must be at least 3 characters.";
  if (!buyer.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(buyer.email.trim())) errors.email = "Enter a valid email address.";
  const mobile = buyer.mobile.replace(/[\s()-]/g, "");
  if (!mobile) errors.mobile = "Mobile number is required.";
  else if (!GEORGIAN_MOBILE.test(mobile)) errors.mobile = "Enter a Georgian mobile number.";
  return errors;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function validatePayment(
  payment: { cardNumber: string; expiry: string; cvv: string },
  now = new Date(),
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (digitsOnly(payment.cardNumber).length !== 16) errors.cardNumber = "Enter a 16-digit card number.";
  const match = /^(\d{2})\/(\d{2})$/.exec(payment.expiry.trim());
  if (!match) {
    errors.expiry = "Enter an expiry date as MM/YY.";
  } else {
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const current = now.getFullYear() * 12 + now.getMonth();
    const expires = year * 12 + (month - 1);
    if (month < 1 || month > 12 || expires < current) errors.expiry = "Enter a future expiry date.";
  }
  if (!/^\d{3}$/.test(payment.cvv)) errors.cvv = "Enter a 3-digit CVV.";
  return errors;
}

export function formatHoldRemaining(expiresAt: string, now = Date.now()): string {
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end)) return "00:00";
  const seconds = Math.max(0, Math.ceil((end - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function holdExpired(expiresAt: string, now = Date.now()): boolean {
  const end = Date.parse(expiresAt);
  return !Number.isFinite(end) || end <= now;
}
