import type { ApiHold, ApiOrder, ApiSeatMap, BuyerDetails, ConfirmedOrder, HallMap, OrderRequest, SeatHold } from "../types/purchase";
import { ApiError, apiRequest } from "./api";

/**
 * Booking uses the documented Kino XII endpoints:
 * GET /sessions/{id}/seats, POST /sessions/{id}/holds, POST /orders.
 * The card is sent only in that order request and is not stored.
 */
export class PurchaseApiError extends Error {
  readonly status: number | null;
  readonly fieldErrors: Record<string, string>;
  readonly conflictingSeatIds: string[];
  readonly conflict: "seats" | "pickup" | null;

  constructor(
    message: string,
    options: {
      status?: number | null;
      fieldErrors?: Record<string, string>;
      conflictingSeatIds?: string[];
      conflict?: "seats" | "pickup" | null;
    } = {},
  ) {
    super(message);
    this.name = "PurchaseApiError";
    this.status = options.status ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
    this.conflictingSeatIds = options.conflictingSeatIds ?? [];
    this.conflict = options.conflict ?? null;
  }
}

function asPurchaseError(error: unknown): never {
  if (error instanceof ApiError) {
    throw new PurchaseApiError(error.message, {
      status: error.status,
      fieldErrors: error.fieldErrors,
      conflictingSeatIds: error.contested,
      conflict: error.status === 409 ? "seats" : null,
    });
  }
  throw error;
}

function georgianMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("995") && digits.length === 12) return digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits.slice(1);
  return digits;
}

export async function fetchHallMap(sessionId: string, adultPrice: number): Promise<HallMap> {
  try {
    const body = await apiRequest<{ data: ApiSeatMap }>(`/sessions/${sessionId}/seats`);
    return {
      sessionId,
      sections: body.data.sections.map((section, sectionIndex) => ({
        id: `${section.name}-${sectionIndex}`,
        label: section.name,
        rows: section.rows.map((row) => ({
          id: `${section.name}-${row.label}`,
          label: row.label,
          seats: row.seats.map((seat) => ({
            id: String(seat.id),
            code: seat.code,
            label: seat.label,
            status: seat.state,
            type: null,
            price: adultPrice,
            aisleAfter: Boolean(seat.aisleAfter),
          })),
        })),
      })),
    };
  } catch (error) {
    asPurchaseError(error);
  }
}

export async function holdSeats(
  sessionId: string,
  seats: { seatId: string; ticketType: string }[],
  options: { auth?: boolean } = {},
): Promise<SeatHold> {
  try {
    const body = await apiRequest<{ data: ApiHold }>(`/sessions/${sessionId}/holds`, {
      method: "POST",
      auth: options.auth,
      json: {
        seats: seats.map((seat) => ({ seatId: Number(seat.seatId), ticketType: seat.ticketType })),
      },
    });
    return {
      id: body.data.holdId,
      expiresAt: body.data.expiresAt,
      seats: body.data.seats.map((seat) => ({ seatId: String(seat.seatId), code: seat.code, price: seat.price })),
    };
  } catch (error) {
    asPurchaseError(error);
  }
}

export async function releaseHold(_holdId: string): Promise<void> {
  // The API replaces a hold when the same session is held again. There is no release call.
}

export async function submitOrder(
  request: OrderRequest,
  payment: { cardNumber: string; expiry: string; cvv: string },
  options: { auth?: boolean } = {},
): Promise<ConfirmedOrder> {
  try {
    const body = await apiRequest<{ data: ApiOrder }>("/orders", {
      method: "POST",
      auth: options.auth,
      json: {
        holdId: request.holdId,
        fullName: request.buyer.fullName.trim(),
        email: request.buyer.email.trim(),
        mobileNumber: georgianMobile(request.buyer.mobile),
        cardNumber: payment.cardNumber,
        expiry: payment.expiry,
        cvv: payment.cvv,
      },
    });
    const order = body.data;
    const hall = order.session?.hall;
    return {
      reference: order.reference,
      status: order.status === "refunded" ? "refunded" : "paid",
      total: order.totalPrice,
      currency: "GEL",
      seats: order.tickets.map((ticket) => ({
        code: ticket.seatCode,
        ticketType: typeof ticket.ticketType === "string" ? ticket.ticketType : ticket.ticketType.slug,
        price: ticket.price,
      })),
      fees: 0,
      foyer: null,
      email: order.contact?.email ?? request.buyer.email.trim(),
      movieTitle: order.session?.movie?.title ?? "",
      venueName: order.session?.venue?.name ?? "",
      hall: typeof hall === "string" ? hall : hall?.name ?? "",
      date: order.session?.date ?? "",
      time: order.session?.time ?? "",
    };
  } catch (error) {
    asPurchaseError(error);
  }
}

export function buyerFromAccount(account: { fullName?: string | null; email: string; mobileNumber?: string | null } | null): BuyerDetails {
  return {
    fullName: account?.fullName ?? "",
    email: account?.email ?? "",
    mobile: account?.mobileNumber ?? "",
  };
}
