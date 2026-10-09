import { useStartPurchase } from "../../purchase/usePurchase";
import type { SessionView } from "../../types/session";

interface SessionItemProps {
  session: SessionView;
  unavailable?: boolean;
}

export default function SessionItem({ session, unavailable = false }: SessionItemProps) {
  const startPurchase = useStartPurchase();
  const seatsClass = session.soldOut ? "is-sold-out" : session.lowAvailability ? "is-low" : "is-open";
  const content = (
    <>
      <div className="session-top">
        <time dateTime={session.startTime}>{session.startTime}</time>
        <span className="session-format">{session.formatLabel}</span>
      </div>
      <p className="session-language" lang="ka">
        {session.languageLabel}
      </p>
      <p className="session-place">
        {session.venueName} · {session.hall}
      </p>
      <div className="session-bottom">
        <span className={`session-seats ${seatsClass}`}>{session.soldOut ? "Sold out" : `${session.seatsRemaining} left`}</span>
        <span className="session-price">{session.priceLabel}</span>
      </div>
    </>
  );

  if (session.soldOut || unavailable) {
    const state = [session.soldOut ? "is-sold-out" : "", unavailable ? "is-restricted" : ""].filter(Boolean).join(" ");
    return (
      <div className={`session-card ${state}`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <button type="button" className="session-card" onClick={() => startPurchase(session.id)}>
      {content}
    </button>
  );
}
