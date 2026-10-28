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

export interface SeatViolation {
  seatId: string;
  code: string;
  reason: string;
}

export interface TicketOrder {
  id: string;
  reference: string;
  status: "paid" | "refunded";
  totalPrice: number;
  paidAt: string;
  isUpcoming: boolean;
  isRefundable: boolean;
  movieTitle: string;
  movieSlug: string;
  posterUrl: string | null;
  venueName: string;
  hall: string;
  date: string;
  time: string;
  seats: string[];
}

export interface StoredBooking {
  reference: string;
  status: "paid" | "refunded";
  total: number;
  movieTitle: string;
  venueName: string;
  hall: string;
  date: string;
  time: string;
  seats: { code: string; ticketType: string; price: number }[];
  email: string;
}

export interface PurchaseContextValue {
  sessionId: string | null;
  openPurchase: (sessionId: string) => void;
  closePurchase: () => void;
}

export interface ApiSeat {
  id: number;
  code: string;
  label: string;
  state: SeatStatus;
  aisleAfter?: boolean;
}

export interface ApiSeatMap {
  sections: { name: string; rows: { label: string; seats: ApiSeat[] }[] }[];
}

export interface ApiHold {
  holdId: string;
  expiresAt: string;
  seats: { seatId: number; code: string; price: number }[];
}

export interface ApiOrder {
  reference: string;
  status?: "paid" | "refunded";
  totalPrice: number;
  contact?: { email?: string };
  session?: {
    date?: string;
    time?: string;
    hall?: { name?: string } | string;
    venue?: { name?: string };
    movie?: { title?: string };
  };
  tickets: { seatCode: string; ticketType: { slug: TicketType } | TicketType; price: number }[];
}

export interface ApiTicketOrder {
  id: number;
  reference: string;
  status: "paid" | "refunded";
  totalPrice: number;
  paidAt: string;
  isUpcoming: boolean;
  isRefundable: boolean;
  session: {
    date: string;
    time: string;
    hall: { name: string };
    venue: { name: string };
    movie: { slug: string; title: string; posterUrl?: string | null };
  };
  tickets: { seatCode: string }[];
}

export interface ConfirmedOrder {
  reference: string;
  status: "paid" | "refunded";
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
  email: string;
  movieTitle: string;
  venueName: string;
  hall: string;
  date: string;
  time: string;
}
