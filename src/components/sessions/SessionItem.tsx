import { useStartPurchase } from "../../purchase/usePurchase";
import type { SessionView } from "../../types/session";

interface SessionItemProps {
  session: SessionView;
  unavailable?: boolean;
  layout?: "default" | "movie";
}

function SeatMark() {
  return (
    <svg className="session-seat-icon" width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 5.2h8v2.2a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 7.4V5.2z" fill="currentColor" />
      <path d="M3.1 5V3.6A1.1 1.1 0 0 1 4.2 2.5h3.6A1.1 1.1 0 0 1 8.9 3.6V5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function SessionItem({ session, unavailable = false, layout = "default" }: SessionItemProps) {
  const startPurchase = useStartPurchase();
  const movieLayout = layout === "movie";
  const seatsClass = session.soldOut ? "is-sold-out" : session.lowAvailability ? "is-low" : "is-open";
  const language = movieLayout ? session.languageCode || session.languageLabel : session.languageLabel;
  const price = movieLayout
    ? `₾${Number.isInteger(session.price) ? session.price : session.price.toFixed(2)}`
    : session.priceLabel;
  const content = movieLayout ? (
    <>
      <div className="session-ticket-main">
        <time dateTime={session.startTime}>{session.startTime}</time>
        <p className="session-ticket-meta">
          <span className="session-language">{language}</span>
          <span className="session-format">{session.formatLabel}</span>
        </p>
      </div>
      <div className="session-ticket-side">
        <span className="session-price">{price}</span>
        <span className={`session-seats ${seatsClass}`}>
          <SeatMark />
          {session.soldOut ? "Sold out" : `${session.seatsRemaining} left`}
        </span>
      </div>
    </>
  ) : (
    <>
      <div className="session-top">
        <time dateTime={session.startTime}>{session.startTime}</time>
        <span className="session-format">{session.formatLabel}</span>
      </div>
      <p className="session-language">
        {language}
      </p>
      <p className="session-place">
        {session.venueName} · {session.hall}
      </p>
      <div className="session-bottom">
        <span className={`session-seats ${seatsClass}`}>{session.soldOut ? "Sold out" : `${session.seatsRemaining} left`}</span>
        <span className="session-price">{price}</span>
      </div>
    </>
  );
  const className = `session-card${movieLayout ? " session-card--movie" : ""}`;

  if (session.soldOut || unavailable) {
    const state = [session.soldOut ? "is-sold-out" : "", unavailable ? "is-restricted" : ""].filter(Boolean).join(" ");
    return (
      <div className={`${className} ${state}`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={() => startPurchase(session.id)}>
      {content}
    </button>
  );
}
