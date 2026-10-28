import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../EmptyState";
import { formatLari } from "../../lib/purchase";
import { userMessage } from "../../lib/userMessage";
import { ApiError } from "../../services/api";
import { fetchTickets, refundTicket } from "../../services/tickets";
import type { TicketOrder } from "../../types/purchase";

export function BookingHistory() {
  const titleId = useId();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [refunding, setRefunding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const refundingRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTickets()
      .then((next) => {
        if (cancelled) return;
        setOrders(next);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(userMessage(reason, "Your tickets could not be loaded."));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const visible = orders.filter((order) => (tab === "upcoming" ? order.isUpcoming : !order.isUpcoming));

  async function refund(reference: string) {
    if (refundingRef.current) return;
    refundingRef.current = reference;
    setRefunding(reference);
    setRefundError(null);
    try {
      const next = await refundTicket(reference);
      setOrders((current) => current.map((order) => (order.reference === reference ? next : order)));
      setConfirming(null);
      setTab("past");
    } catch (reason: unknown) {
      if (reason instanceof ApiError && reason.status === 422) {
        setRefundError(reason.message.trim() || "This order cannot be refunded.");
      } else {
        setRefundError(userMessage(reason, "The refund could not be completed."));
      }
    } finally {
      refundingRef.current = null;
      setRefunding(null);
    }
  }

  return (
    <section className="account-card" aria-labelledby={titleId}>
      <h2 id={titleId}>Booking history</h2>
      <p>Only orders linked to this account are listed. A purchase is not added here from an email address alone.</p>
      <div className="account-tabs" role="tablist" aria-label="Booking history">
        <button type="button" role="tab" aria-selected={tab === "upcoming"} className={tab === "upcoming" ? "is-selected" : ""} onClick={() => setTab("upcoming")}>
          Upcoming
        </button>
        <button type="button" role="tab" aria-selected={tab === "past"} className={tab === "past" ? "is-selected" : ""} onClick={() => setTab("past")}>
          Past
        </button>
      </div>
      {status === "loading" ? (
        <div aria-busy="true">
          <p className="sr-only">Loading tickets</p>
          <div className="skeleton account-ticket-skel" />
          <div className="skeleton account-ticket-skel" />
        </div>
      ) : null}
      {status === "error" ? (
        <EmptyState
          title="Tickets could not be loaded"
          message={error ?? "Your tickets could not be loaded."}
          action={
            <button type="button" className="clear-filters" onClick={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}>
              Retry
            </button>
          }
        />
      ) : null}
      {status === "ready" && orders.length === 0 ? (
        <EmptyState
          title="You don't have any upcoming tickets yet."
          message="Book a screening to see it here."
          action={
            <Link className="clear-filters" to="/sessions">
              Browse sessions
            </Link>
          }
        />
      ) : null}
      {status === "ready" && orders.length > 0 && visible.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "You don't have any upcoming tickets yet." : "You don't have any past tickets."}
          message={tab === "upcoming" ? "Book a screening to see it here." : "Past and refunded orders appear in this list."}
          action={
            tab === "upcoming" ? (
              <Link className="clear-filters" to="/sessions">
                Browse sessions
              </Link>
            ) : null
          }
        />
      ) : null}
      {status === "ready" && visible.length > 0 ? (
        <ul className="account-bookings">
          {visible.map((order) => (
            <li key={order.reference} className="account-booking">
              {order.posterUrl ? <img src={order.posterUrl} alt="" /> : <span className="account-poster-fallback" aria-hidden="true" />}
              <div>
                <h3>
                  <Link to={`/movies/${order.movieSlug}`}>{order.movieTitle}</Link>
                </h3>
                <p>
                  {order.venueName} · Hall {order.hall}
                </p>
                <p>
                  {order.date} · {order.time}
                </p>
                <p>
                  {order.seats.length} {order.seats.length === 1 ? "ticket" : "tickets"} · {order.seats.join(", ")}
                </p>
                <p>
                  {formatLari(order.totalPrice)} · {order.reference}
                </p>
                <p className={order.status === "refunded" ? "account-status is-refunded" : "account-status"}>{order.status === "refunded" ? "Refunded" : "Confirmed"}</p>
                {order.isRefundable ? (
                  confirming === order.reference ? (
                    <div className="account-actions">
                      <p>Refund this order? The seats go back on sale and this cannot be undone.</p>
                      <button type="button" className="account-primary" disabled={refunding === order.reference} onClick={() => void refund(order.reference)}>
                        {refunding === order.reference ? "Refunding..." : "Confirm refund"}
                      </button>
                      <button type="button" className="account-secondary" disabled={refunding === order.reference} onClick={() => setConfirming(null)}>
                        Keep tickets
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="account-secondary" onClick={() => setConfirming(order.reference)}>
                      Refund
                    </button>
                  )
                ) : null}
                {order.isUpcoming && order.status === "paid" && !order.isRefundable ? <p className="account-hint">Refunds are closed for this screening.</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {refundError ? (
        <p className="field-error" role="alert">
          {refundError}
        </p>
      ) : null}
    </section>
  );
}
