import { Fragment, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { FORMATS } from "../../data/sessionOptions";
import { useAuth } from "../../auth/useAuth";
import { AuthApiError } from "../../services/auth";
import { useSessionCatalog } from "../../hooks/useSessionCatalog";
import {
  availabilityViolations,
  changeTicketType,
  childTicketsBlocked,
  formatHoldRemaining,
  formatLari,
  holdExpired,
  profileBlock,
  purchaseAgeBlock,
  removeLostSeats,
  seatAmount,
  subtotal,
  ticketViolations,
  toggleSeat,
  validateBuyer,
  validatePayment,
  digitsOnly,
} from "../../lib/purchase";
import { usePurchase } from "../../purchase/usePurchase";
import { buyerFromAccount, fetchHallMap, holdSeats, PurchaseApiError, releaseHold, submitOrder } from "../../services/purchase";
import { loadSessionSummary, type SessionSummary } from "../../services/sessions";
import type { BuyerDetails, ConfirmedOrder, HallMap, SeatHold, SelectedSeat, TicketType } from "../../types/purchase";

const EXPIRED_MESSAGE = "Your hold time expired. Please re-select your seats.";

export default function PurchaseModal() {
  const { sessionId, closePurchase } = usePurchase();
  if (!sessionId) return null;
  return <PurchaseDialog key={sessionId} sessionId={sessionId} onClose={closePurchase} />;
}

function PurchaseDialog({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const titleId = useId();
  const { account } = useAuth();
  const catalogState = useSessionCatalog();
  const catalog = catalogState.data;
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const listed = catalog?.sessions.find((item) => item.id === sessionId) ?? null;
  const session = listed ?? summary?.session ?? null;
  const movie = listed ? catalog?.movies.find((item) => item.id === listed.movieId) ?? null : summary?.movie ?? null;
  const venue = listed ? catalog?.venues.find((item) => item.id === listed.venueId) ?? null : null;

  useEffect(() => {
    if (!catalog || catalog.sessions.some((item) => item.id === sessionId)) return;
    let cancelled = false;
    loadSessionSummary(sessionId)
      .then((next) => {
        if (!cancelled) setSummary(next);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, sessionId]);
  const ageRating = movie?.ageRating ?? "";
  const blockedProfile = profileBlock(account?.profileComplete ?? null);
  const blockedAge = session ? purchaseAgeBlock(ageRating, account?.dateOfBirth ?? null) : null;
  const canLoadMap = Boolean(session && account && !blockedProfile && !blockedAge);

  const [step, setStep] = useState<"seats" | "checkout" | "confirmation">("seats");
  const [map, setMap] = useState<HallMap | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "error" | "ready">("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [selected, setSelected] = useState<SelectedSeat[]>([]);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [hold, setHold] = useState<SeatHold | null>(null);
  const [holdMessage, setHoldMessage] = useState<string | null>(null);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [leaveWarning, setLeaveWarning] = useState(false);
  const [buyer, setBuyer] = useState<BuyerDetails>(() => buyerFromAccount(account));
  const checkoutBuyer: BuyerDetails = {
    fullName: buyer.fullName || account?.fullName || "",
    email: buyer.email || account?.email || "",
    mobile: buyer.mobile || account?.mobileNumber || "",
  };
  const [buyerErrors, setBuyerErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [ticketsNote, setTicketsNote] = useState<string | null>(null);
  const holdingRef = useRef(false);

  useEffect(() => {
    if (!canLoadMap) return;
    let cancelled = false;
    fetchHallMap(sessionId, session?.price ?? 0)
      .then((next) => {
        if (!cancelled) {
          setMap(next);
          setMapStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMap(null);
        setMapStatus("error");
        setMapError(error instanceof Error ? error.message : "The hall map could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [canLoadMap, mapAttempt, session?.price, sessionId]);

  function expireHold() {
    setHold(null);
    setSelected([]);
    setLimitMessage(null);
    setHoldMessage(null);
    setStep("seats");
    setExpiredMessage(EXPIRED_MESSAGE);
    setMapAttempt((attempt) => attempt + 1);
  }

  useEffect(() => {
    if (!hold) return;
    const check = () => {
      if (holdExpired(hold.expiresAt)) expireHold();
    };
    const timer = window.setInterval(check, 1000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [hold]);

  const requestCloseRef = useRef<() => void>(() => {});

  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function requestClose() {
    if (holdingRef.current) return;
    if (hold) {
      setLeaveWarning(true);
      return;
    }
    onClose();
  }

  async function confirmLeave() {
    const active = hold;
    setHold(null);
    setLeaveWarning(false);
    if (active) {
      try {
        await releaseHold(active.id);
      } catch {
        // The release endpoint is not defined. Local state is cleared without claiming the server released the seats.
      }
    }
    onClose();
  }

  const violations = [
    ...(map ? availabilityViolations(selected, map) : []),
    ...ticketViolations(selected, ageRating),
  ];
  const total = subtotal(selected);
  const canContinue =
    canLoadMap &&
    selected.length > 0 &&
    selected.length <= 3 &&
    violations.length === 0 &&
    mapStatus === "ready";

  async function onNext() {
    if (!canContinue || holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    setHoldMessage(null);
    try {
      const nextHold = await holdSeats(
        sessionId,
        selected.map((seat) => ({ seatId: seat.seatId, ticketType: seat.ticketType })),
      );
      setHold(nextHold);
      setSelected((current) =>
        current.map((seat) => {
          const priced = nextHold.seats?.find((item) => item.seatId === seat.seatId || item.code === seat.code);
          return priced ? { ...seat, linePrice: priced.price } : seat;
        }),
      );
      setStep("checkout");
      setExpiredMessage(null);
    } catch (error) {
      if (error instanceof PurchaseApiError && error.conflict === "seats") {
        const next = removeLostSeats(selected, error.conflictingSeatIds);
        setSelected(next.kept);
        const codes = next.removed.map((seat) => seat.code).join(", ");
        setHoldMessage(
          codes
            ? `These seats were taken: ${codes}. Choose another seat and try again.`
            : error.message,
        );
        setMapAttempt((attempt) => attempt + 1);
      } else {
        setHoldMessage(error instanceof Error ? error.message : "The seats could not be held.");
      }
    } finally {
      holdingRef.current = false;
      setHolding(false);
    }
  }

  const formatLabel = session ? FORMATS.find((item) => item.id === session.format)?.label ?? summary?.formatLabel ?? session.format : "";
  const languageLabel = session
    ? catalog?.languageChoices.find((item) => item.id === session.language)?.label ?? summary?.languageLabel ?? session.language
    : "";

  return (
    <div
      className="purchase-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        className="purchase-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="purchase-close" aria-label="Close" onClick={requestClose}>
          ×
        </button>
        <header className="purchase-head">
          <h2 id={titleId}>{movie?.title ?? "Tickets"}</h2>
          {session ? (
            <p className="purchase-meta">
              {venue?.name ?? summary?.venueName ?? "Venue"} · {session.hall}
              <span>
                {session.date} · {session.startTime}
              </span>
              <span>
                {formatLabel} · {languageLabel}
              </span>
            </p>
          ) : (
            <p>{catalogState.status === "loading" ? "Loading the showtime…" : "This showtime could not be found."}</p>
          )}
          {step === "confirmation" ? (
            <p className="purchase-success-title">Order confirmed</p>
          ) : (
            <p className="purchase-steps" aria-label="Purchase steps">
              <span className={step === "seats" ? "is-current" : ""}>1. Seats</span>
              <span aria-hidden="true">→</span>
              <span className={step === "checkout" ? "is-current" : ""}>2. Checkout</span>
            </p>
          )}
        </header>

        {blockedProfile && account?.profileComplete === false ? <ProfileForm /> : null}
        {blockedProfile && account?.profileComplete !== false ? <p className="purchase-block">{blockedProfile}</p> : null}
        {!blockedProfile && blockedAge ? <p className="purchase-block">{blockedAge}</p> : null}
        {expiredMessage ? <p className="purchase-block">{expiredMessage}</p> : null}

        {step === "seats" && canLoadMap ? (
          <SeatStep
            map={map}
            mapStatus={mapStatus}
            mapError={mapError}
            selected={selected}
            ageRating={ageRating}
            limitMessage={limitMessage}
            holdMessage={holdMessage}
            violations={violations}
            total={total}
            holding={holding}
            canContinue={canContinue}
            onRetry={() => {
              setMapStatus("loading");
              setMapError(null);
              setMapAttempt((attempt) => attempt + 1);
            }}
            onToggle={(seat) => {
              const next = toggleSeat(selected, seat);
              setSelected(next.selected);
              setLimitMessage(next.message);
            }}
            onTicketType={(seatId, ticketType) => setSelected((current) => changeTicketType(current, seatId, ticketType))}
            onNext={() => void onNext()}
          />
        ) : null}

        {step === "checkout" && hold ? (
          <CheckoutStep
            sessionId={sessionId}
            hold={hold}
            selected={selected}
            total={total}
            buyer={checkoutBuyer}
            buyerErrors={buyerErrors}
            onBuyer={(next) => setBuyer(next)}
            onExpired={expireHold}
            onSeatConflict={(lost, message) => {
              const next = removeLostSeats(selected, lost);
              setSelected(next.kept);
              setHold(null);
              setStep("seats");
              setHoldMessage(message);
              setMapStatus("loading");
              setMapAttempt((attempt) => attempt + 1);
            }}
            onSuccess={(next) => {
              setOrder(next);
              setHold(null);
              setStep("confirmation");
            }}
            onFieldErrors={setBuyerErrors}
          />
        ) : null}

        {step === "confirmation" && order ? (
          <ConfirmationStep
            order={order}
            movieTitle={movie?.title ?? ""}
            venueName={venue?.name ?? summary?.venueName ?? ""}
            hall={session?.hall ?? ""}
            when={session ? `${session.date} · ${session.startTime}` : ""}
            ticketsNote={ticketsNote}
            onTickets={() => setTicketsNote("My Tickets is not available because that page is not in this app.")}
            onClose={onClose}
          />
        ) : null}

        {leaveWarning ? (
          <div className="purchase-leave" role="alertdialog" aria-label="Leave purchase">
            <p>Leave this purchase? The hold stays until it expires.</p>
            <div>
              <button type="button" onClick={() => setLeaveWarning(false)}>
                Stay
              </button>
              <button type="button" onClick={() => void confirmLeave()}>
                Leave
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SeatStep({
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
          {holding ? "Holding seats…" : "Next: Checkout"}
        </button>
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

function CheckoutStep({
  sessionId,
  hold,
  selected,
  total,
  buyer,
  buyerErrors,
  onBuyer,
  onExpired,
  onSeatConflict,
  onSuccess,
  onFieldErrors,
}: {
  sessionId: string;
  hold: SeatHold;
  selected: SelectedSeat[];
  total: number;
  buyer: BuyerDetails;
  buyerErrors: Record<string, string>;
  onBuyer: (buyer: BuyerDetails) => void;
  onExpired: () => void;
  onSeatConflict: (lost: string[], message: string) => void;
  onSuccess: (order: ConfirmedOrder) => void;
  onFieldErrors: (errors: Record<string, string>) => void;
}) {
  const [remaining, setRemaining] = useState(() => formatHoldRemaining(hold.expiresAt));
  const [warning, setWarning] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      if (holdExpired(hold.expiresAt)) {
        onExpired();
        return;
      }
      setRemaining(formatHoldRemaining(hold.expiresAt));
      setWarning(Date.parse(hold.expiresAt) - Date.now() <= 60_000);
    };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [hold.expiresAt, onExpired]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextBuyerErrors = validateBuyer(buyer);
    const nextPaymentErrors = validatePayment({ cardNumber, expiry, cvv });
    onFieldErrors(nextBuyerErrors);
    setPaymentErrors(nextPaymentErrors);
    setFormError(null);
    if (Object.keys(nextBuyerErrors).length > 0 || Object.keys(nextPaymentErrors).length > 0) return;
    if (holdExpired(hold.expiresAt)) {
      onExpired();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const confirmed = await submitOrder(
        {
          holdId: hold.id,
          sessionId,
          seats: selected.map((seat) => ({ seatId: seat.seatId, ticketType: seat.ticketType })),
          buyer: { ...buyer, fullName: buyer.fullName.trim(), email: buyer.email.trim() },
          foyer: null,
        },
        { cardNumber, expiry, cvv },
      );
      setCardNumber("");
      setCvv("");
      onSuccess(confirmed);
    } catch (error) {
      if (error instanceof PurchaseApiError && error.status === 422 && Object.keys(error.fieldErrors).length === 0) {
        if (error.message === EXPIRED_MESSAGE) onExpired();
        else setFormError(error.message);
      } else if (error instanceof PurchaseApiError && error.status === 422) {
        const buyerMap: Record<string, string> = {};
        const paymentMap: Record<string, string> = {};
        for (const [key, message] of Object.entries(error.fieldErrors)) {
          if (key === "cardNumber" || key === "expiry" || key === "cvv") paymentMap[key] = message;
          else buyerMap[key] = message;
        }
        onFieldErrors(buyerMap);
        setPaymentErrors(paymentMap);
      } else if (error instanceof PurchaseApiError && error.conflict === "seats") {
        onSeatConflict(error.conflictingSeatIds, error.message);
      } else {
        setFormError(error instanceof Error ? error.message : "The order could not be completed.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="purchase-checkout" onSubmit={(event) => void onSubmit(event)} noValidate>
      <p className={`purchase-timer${warning ? " is-warning" : ""}`}>Hold time {remaining}</p>
      <ul className="purchase-lines">
        {selected.map((seat) => (
          <li key={seat.seatId}>
            <span>
              {seat.code} · {seat.ticketType}
            </span>
            <strong>{formatLari(seatAmount(seat))}</strong>
          </li>
        ))}
      </ul>
      <p className="purchase-total">
        Tickets <strong>{formatLari(total)}</strong>
      </p>
      <p className="purchase-muted">Foyer food and drinks are not connected. You can continue without them.</p>
      <p className="purchase-muted">Fees and the final total are confirmed by the order service.</p>
      <label>
        Full Name
        <input
          name="fullName"
          autoComplete="name"
          value={buyer.fullName}
          aria-invalid={Boolean(buyerErrors.fullName)}
          onChange={(event) => onBuyer({ ...buyer, fullName: event.target.value })}
        />
      </label>
      {buyerErrors.fullName ? <p className="purchase-warn">{buyerErrors.fullName}</p> : null}
      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={buyer.email}
          aria-invalid={Boolean(buyerErrors.email)}
          onChange={(event) => onBuyer({ ...buyer, email: event.target.value })}
        />
      </label>
      {buyerErrors.email ? <p className="purchase-warn">{buyerErrors.email}</p> : null}
      <label>
        Mobile Number
        <input
          type="tel"
          name="mobile"
          autoComplete="tel"
          inputMode="tel"
          value={buyer.mobile}
          aria-invalid={Boolean(buyerErrors.mobile)}
          onChange={(event) => onBuyer({ ...buyer, mobile: event.target.value })}
        />
      </label>
      {buyerErrors.mobile ? <p className="purchase-warn">{buyerErrors.mobile}</p> : null}
      <label>
        Card Number
        <input
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardNumber}
          aria-invalid={Boolean(paymentErrors.cardNumber)}
          onChange={(event) => {
            const digits = digitsOnly(event.target.value).slice(0, 16);
            setCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
          }}
        />
      </label>
      {paymentErrors.cardNumber ? <p className="purchase-warn">{paymentErrors.cardNumber}</p> : null}
      <div className="purchase-pay-row">
        <label>
          Expiry
          <input
            name="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            aria-invalid={Boolean(paymentErrors.expiry)}
            onChange={(event) => {
              const digits = digitsOnly(event.target.value).slice(0, 4);
              setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
            }}
          />
        </label>
        <label>
          CVV
          <input
            name="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvv}
            aria-invalid={Boolean(paymentErrors.cvv)}
            onChange={(event) => setCvv(digitsOnly(event.target.value).slice(0, 3))}
          />
        </label>
      </div>
      {paymentErrors.expiry ? <p className="purchase-warn">{paymentErrors.expiry}</p> : null}
      {paymentErrors.cvv ? <p className="purchase-warn">{paymentErrors.cvv}</p> : null}
      {formError ? <p className="purchase-warn">{formError}</p> : null}
      <button type="submit" className="purchase-next" disabled={submitting}>
        {submitting ? "Sending order…" : "Pay & Complete Order"}
      </button>
    </form>
  );
}

function ProfileForm() {
  const { account, saveProfile } = useAuth();
  const [fullName, setFullName] = useState(account?.fullName ?? "");
  const [mobileNumber, setMobileNumber] = useState(account?.mobileNumber ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(account?.dateOfBirth ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const next: Record<string, string> = {};
    if (fullName.trim().length < 3) next.fullName = "Full name must be at least 3 characters.";
    const mobile = mobileNumber.replace(/[\s()-]/g, "");
    if (!/^5\d{8}$/.test(mobile)) next.mobileNumber = "Enter a 9-digit mobile number starting with 5.";
    if (!dateOfBirth) next.dateOfBirth = "Date of birth is required.";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await saveProfile({ fullName, mobileNumber, dateOfBirth });
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(error instanceof Error ? error.message : "The profile could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="purchase-checkout" onSubmit={(event) => void onSubmit(event)} noValidate>
      <p className="purchase-block">Complete your profile before buying tickets.</p>
      <label>
        Full name
        <input name="fullName" autoComplete="name" value={fullName} aria-invalid={Boolean(errors.fullName)} onChange={(event) => setFullName(event.target.value)} />
      </label>
      {errors.fullName ? <p className="purchase-warn">{errors.fullName}</p> : null}
      <label>
        Mobile number
        <input name="mobileNumber" autoComplete="tel" inputMode="tel" value={mobileNumber} aria-invalid={Boolean(errors.mobileNumber || errors.mobile)} onChange={(event) => setMobileNumber(event.target.value)} />
      </label>
      {errors.mobileNumber || errors.mobile ? <p className="purchase-warn">{errors.mobileNumber || errors.mobile}</p> : null}
      <label>
        Date of birth
        <input type="date" name="dateOfBirth" autoComplete="bday" value={dateOfBirth} aria-invalid={Boolean(errors.dateOfBirth)} onChange={(event) => setDateOfBirth(event.target.value)} />
      </label>
      {errors.dateOfBirth ? <p className="purchase-warn">{errors.dateOfBirth}</p> : null}
      {formError ? <p className="purchase-warn">{formError}</p> : null}
      <button type="submit" className="purchase-next" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function ConfirmationStep({
  order,
  movieTitle,
  venueName,
  hall,
  when,
  ticketsNote,
  onTickets,
  onClose,
}: {
  order: ConfirmedOrder;
  movieTitle: string;
  venueName: string;
  hall: string;
  when: string;
  ticketsNote: string | null;
  onTickets: () => void;
  onClose: () => void;
}) {
  return (
    <section className="purchase-confirm">
      <p>Your tickets are confirmed.</p>
      <p>
        Order reference <strong>{order.reference}</strong>
      </p>
      <p>
        {movieTitle}
        <span>
          {venueName} · {hall}
        </span>
        <span>{when}</span>
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
      {order.foyer ? (
        <p>
          {order.foyer.summary}
          {order.foyer.pickupSlot ? ` · ${order.foyer.pickupSlot}` : ""}
          {order.foyer.pickupCode ? ` · Pickup ${order.foyer.pickupCode}` : ""}
        </p>
      ) : null}
      {ticketsNote ? <p className="purchase-warn">{ticketsNote}</p> : null}
      <div className="purchase-confirm-actions">
        <button type="button" onClick={onTickets}>
          My Tickets
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
