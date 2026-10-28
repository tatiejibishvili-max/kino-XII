import { Fragment } from "react";
import { childTicketsBlocked, formatLari, seatAmount } from "../../lib/purchase";
import type { HallMap, SelectedSeat, TicketType } from "../../types/purchase";

export function SeatStep({
  map,
  mapStatus,
  mapError,
  selected,
  ageRating,
  limitMessage,
  holdMessage,
  violations,
  total,
  holding,
  canContinue,
  onRetry,
  onToggle,
  onTicketType,
  onNext,
  checkoutLabel,
  onAccount,
}: {
  map: HallMap | null;
  mapStatus: "loading" | "error" | "ready";
  mapError: string | null;
  selected: SelectedSeat[];
  ageRating: string;
  limitMessage: string | null;
  holdMessage: string | null;
  violations: { seatId: string; code: string; reason: string }[];
  total: number;
  holding: boolean;
  canContinue: boolean;
  onRetry: () => void;
  onToggle: (seat: HallMap["sections"][number]["rows"][number]["seats"][number]) => void;
  onTicketType: (seatId: string, ticketType: TicketType) => void;
  onNext: () => void;
  checkoutLabel: string;
  onAccount?: () => void;
}) {
  const childBlocked = childTicketsBlocked(ageRating);
  return (
    <div className="purchase-body">
      <section className="purchase-map-panel" aria-label="Seat map">
        <SeatLegend />
        {mapStatus === "loading" ? <p className="purchase-status">Loading the hall…</p> : null}
        {mapStatus === "error" ? (
          <div className="purchase-status">
            <p>{mapError}</p>
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : null}
        {map ? <SeatMap map={map} selected={selected} onToggle={onToggle} /> : null}
      </section>
      <aside className="purchase-summary">
        <h3>Your seats</h3>
        {selected.length === 0 ? <p className="purchase-muted">Select a seat to continue.</p> : null}
        <ul>
          {selected.map((seat) => (
            <li key={seat.seatId}>
              <span>
                {seat.code} · {seat.seatType}
              </span>
              <label>
                <span className="purchase-sr">Ticket type for {seat.code}</span>
                <select
                  value={seat.ticketType}
                  onChange={(event) => onTicketType(seat.seatId, event.target.value as TicketType)}
                >
                  <option value="adult">Adult</option>
                  <option value="child" disabled={childBlocked}>
                    Child
                  </option>
                  <option value="student">Student</option>
                </select>
              </label>
              <strong>{formatLari(seatAmount(seat))}</strong>
            </li>
          ))}
        </ul>
        {limitMessage ? <p className="purchase-warn">{limitMessage}</p> : null}
        {holdMessage ? <p className="purchase-warn">{holdMessage}</p> : null}
        {violations.map((item) => (
          <p key={item.seatId} className="purchase-warn">
            {item.code}: {item.reason}
          </p>
        ))}
        <p className="purchase-total">
          Subtotal <strong>{formatLari(total)}</strong>
        </p>
        <button type="button" className="purchase-next" disabled={!canContinue || holding} onClick={onNext}>
          {holding ? "Holding seats…" : checkoutLabel}
        </button>
        {onAccount ? (
          <button type="button" className="purchase-next purchase-next-secondary" onClick={onAccount}>
            Pay with an account
          </button>
        ) : null}
      </aside>
    </div>
  );
}

function SeatLegend() {
  const items = [
    ["available", "Available"],
    ["selected", "Selected"],
    ["sold", "Sold"],
    ["held", "Held"],
    ["unavailable", "Unavailable"],
  ] as const;
  return (
    <ul className="purchase-legend">
      {items.map(([status, label]) => (
        <li key={status}>
          <span className={`purchase-swatch is-${status}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function SeatMap({
  map,
  selected,
  onToggle,
}: {
  map: HallMap;
  selected: SelectedSeat[];
  onToggle: (seat: HallMap["sections"][number]["rows"][number]["seats"][number]) => void;
}) {
  const chosen = new Set(selected.map((seat) => seat.seatId));
  return (
    <div className="purchase-map">
      {map.sections.map((section) => (
        <section key={section.id}>
          <h3>{section.label}</h3>
          {section.rows.map((row) => (
            <div key={row.id} className="purchase-row">
              <span>{row.label}</span>
              <div>
                {row.seats.map((seat) => {
                  const isSelected = chosen.has(seat.id);
                  const disabled = seat.status !== "available";
                  return (
                    <Fragment key={seat.id}>
                      {seat.status === "unavailable" ? (
                        <span className="purchase-gap" aria-hidden="true" />
                      ) : (
                        <button
                          type="button"
                          className={`purchase-seat is-${isSelected ? "selected" : seat.status}`}
                          disabled={disabled}
                          aria-pressed={isSelected}
                          aria-label={`${seat.code}, ${isSelected ? "selected" : seat.status}`}
                          onClick={() => onToggle(seat)}
                        >
                          {seat.label}
                        </button>
                      )}
                      {seat.aisleAfter ? <span className="purchase-gap" aria-hidden="true" /> : null}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
