import { formatLari } from "../../lib/purchase";
import type { ConfirmedOrder } from "../../types/purchase";

export function ConfirmationStep({
  order,
  movieTitle,
  venueName,
  hall,
  when,
  signedIn,
  onTickets,
  onView,
  onClose,
}: {
  order: ConfirmedOrder;
  movieTitle: string;
  venueName: string;
  hall: string;
  when: string;
  signedIn: boolean;
  onTickets: () => void;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <section className="purchase-confirm">
      <p>Your tickets are confirmed.</p>
      <p>
        Order reference <strong>{order.reference}</strong>
      </p>
      <p>
        {order.movieTitle || movieTitle}
        <span>
          {order.venueName || venueName} · {order.hall || hall}
        </span>
        <span>{order.date && order.time ? `${order.date} · ${order.time}` : when}</span>
      </p>
      <ul>
        {order.seats.map((seat) => (
          <li key={seat.code}>
            {seat.code} · {seat.ticketType} · {formatLari(seat.price)}
          </li>
        ))}
      </ul>
      <p>
        Paid <strong>{formatLari(order.total)}</strong>
      </p>
      <p>The cinema service did not report a ticket email.</p>
      {signedIn ? null : (
        <p>This confirmation stays in this browser. An account created later with the same email does not receive the order, because the service has no verified way to attach it.</p>
      )}
      {order.foyer ? (
        <p>
          {order.foyer.summary}
          {order.foyer.pickupSlot ? ` · ${order.foyer.pickupSlot}` : ""}
          {order.foyer.pickupCode ? ` · Pickup ${order.foyer.pickupCode}` : ""}
        </p>
      ) : null}
      <div className="purchase-confirm-actions">
        <button type="button" onClick={onView}>
          View confirmation
        </button>
        {signedIn ? (
          <button type="button" onClick={onTickets}>
            My Tickets
          </button>
        ) : null}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
