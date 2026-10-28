import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { formatLari } from "../lib/purchase";
import { readBooking } from "../services/bookings";

export default function BookingPage() {
  const { reference = "" } = useParams();
  const booking = readBooking(reference);
  const hasBooking = Boolean(booking);

  useEffect(() => {
    const previous = document.title;
    document.title = hasBooking ? `Booking ${reference} · KINO XII` : "Booking · KINO XII";
    return () => {
      document.title = previous;
    };
  }, [hasBooking, reference]);

  return (
    <div className="page booking-page">
      <Header variant="solid" />
      <main className="booking-main">
        {booking ? (
          <article className="booking-card">
            <p className="booking-kicker">{booking.status === "paid" ? "Confirmed" : "Refunded"}</p>
            <h1>Booking {booking.reference}</h1>
            <p className="booking-title">{booking.movieTitle}</p>
            <p>
              {booking.venueName}
              {booking.hall ? ` · ${booking.hall}` : ""}
            </p>
            <p>
              {booking.date} · {booking.time}
            </p>
            <ul>
              {booking.seats.map((seat) => (
                <li key={seat.code}>
                  {seat.code} · {seat.ticketType} · {formatLari(seat.price)}
                </li>
              ))}
            </ul>
            <p>
              Total <strong>{formatLari(booking.total)}</strong>
            </p>
            <p>The cinema service did not report a ticket email.</p>
            <p>This page shows the payment response kept in this browser. It cannot look up another customer's booking, and an email address alone does not open it.</p>
            <Link className="clear-filters" to="/sessions">
              Browse sessions
            </Link>
          </article>
        ) : (
          <EmptyState
            title="This booking cannot be opened"
            message="The cinema service has no public booking lookup. A confirmation is available in this browser only after a payment response, and it is not opened from an email address."
            action={
              <Link className="clear-filters" to="/sessions">
                Browse sessions
              </Link>
            }
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
