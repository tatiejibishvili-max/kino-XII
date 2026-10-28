import type { ApiTicketOrder, TicketOrder } from "../types/purchase";
import { apiRequest } from "./api";

function orderFromApi(order: ApiTicketOrder): TicketOrder {
  return {
    id: String(order.id),
    reference: order.reference,
    status: order.status,
    totalPrice: order.totalPrice,
    paidAt: order.paidAt,
    isUpcoming: order.isUpcoming,
    isRefundable: order.isRefundable,
    movieTitle: order.session.movie.title,
    movieSlug: order.session.movie.slug,
    posterUrl: order.session.movie.posterUrl ?? null,
    venueName: order.session.venue.name,
    hall: order.session.hall.name,
    date: order.session.date,
    time: order.session.time,
    seats: order.tickets.map((ticket) => ticket.seatCode),
  };
}

export async function fetchTickets(): Promise<TicketOrder[]> {
  const body = await apiRequest<{ data: ApiTicketOrder[] }>("/tickets");
  return body.data.map(orderFromApi).sort((left, right) => Date.parse(right.paidAt) - Date.parse(left.paidAt));
}

export async function refundTicket(reference: string): Promise<TicketOrder> {
  const body = await apiRequest<{ data: ApiTicketOrder }>(`/orders/${encodeURIComponent(reference)}/refund`, { method: "POST" });
  return orderFromApi(body.data);
}
