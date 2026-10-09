export type SeatStatus = "available" | "sold" | "held" | "unavailable";

export type TicketType = "adult" | "child" | "student";

export interface HallSeat {
  id: string;
  code: string;
  label: string;
  status: SeatStatus;
  type: string | null;
  price: number | null;
  aisleAfter?: boolean;
}

export interface HallRow {
  id: string;
  label: string;
  seats: HallSeat[];
}

export interface HallSection {
  id: string;
  label: string;
  rows: HallRow[];
}

export interface HallMap {
  sessionId: string;
  sections: HallSection[];
}

export interface SelectedSeat {
  seatId: string;
  code: string;
  seatType: string;
  ticketType: TicketType;
  basePrice: number;
  linePrice?: number;
}

export interface SeatHold {
  id: string;
  expiresAt: string;
  seats?: { seatId: string; code: string; price: number }[];
}

export interface BuyerDetails {
  fullName: string;
  email: string;
  mobile: string;
}

export interface OrderSeat {
  seatId: string;
  ticketType: TicketType;
}

export interface OrderRequest {
  holdId: string;
  sessionId: string;
  seats: OrderSeat[];
  buyer: BuyerDetails;
  foyer: null;
}

export interface ConfirmedSeat {
  code: string;
  ticketType: TicketType;
  price: number;
}

export interface ConfirmedOrder {
  reference: string;
  total: number;
  currency: string;
  seats: ConfirmedSeat[];
  fees: number;
  foyer: {
    summary: string;
    subtotal: number;
    pickupSlot: string | null;
    pickupCode: string | null;
  } | null;
}
