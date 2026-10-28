import { Fragment, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
import FieldStatus from "../form/FieldStatus";
import { useDialog } from "../../lib/useDialog";
import { userMessage } from "../../lib/userMessage";
import { rememberBooking } from "../../services/bookings";
import { buyerFromAccount, fetchHallMap, holdSeats, PurchaseApiError, releaseHold, submitOrder } from "../../services/purchase";
import { loadSessionSummary } from "../../services/sessions";
import type { SessionSummary } from "../../types/session";
import type { BuyerDetails, ConfirmedOrder, HallMap, SeatHold, SelectedSeat, TicketType } from "../../types/purchase";

const EXPIRED_MESSAGE = "Your hold time expired. Please re-select your seats.";

export default function PurchaseModal() {
  const { sessionId, closePurchase } = usePurchase();
  if (!sessionId) return null;
  return <PurchaseDialog key={sessionId} sessionId={sessionId} onClose={closePurchase} />;
}

function PurchaseDialog({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const titleId = useId();
  const navigate = useNavigate();
  const { account, openLogin, openRegister } = useAuth();
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
  const blockedProfile = account ? profileBlock(account.profileComplete) : null;
  const blockedAge = session ? purchaseAgeBlock(ageRating, account?.dateOfBirth ?? null) : null;
  const canLoadMap = Boolean(session && !blockedProfile && !blockedAge);

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
  const [guestBlocked, setGuestBlocked] = useState(false);
  const holdingRef = useRef(false);
  const guestHoldRefused = guestBlocked && !account;

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
        setMapError(userMessage(error, "The hall map could not be loaded."));
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
  const dialogRef = useDialog<HTMLDivElement>(true, () => requestCloseRef.current());

  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  function requestClose() {
    if (holdingRef.current) return;
    if (leaveWarning) {
      setLeaveWarning(false);
      return;
    }
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
        { auth: Boolean(account) },
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
      } else if (error instanceof PurchaseApiError && error.status === 401) {
        if (account) setHoldMessage("Your session expired. Sign in again, then hold these seats.");
        else setGuestBlocked(true);
      } else {
        setHoldMessage(userMessage(error, "The seats could not be held."));
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
        ref={dialogRef}
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
        {guestHoldRefused ? (
          <div className="purchase-guest">
            <p>
              Guest checkout cannot reserve these seats. The cinema service refused the hold because this browser is not signed in. No card was sent and no booking was saved.
            </p>
            <p>
              Log in or create an account to pay for the seats already selected. An order is confirmed only after that payment is accepted. Creating an account with the same email does not attach this attempt, because the service stored nothing.
            </p>
            <div className="purchase-confirm-actions">
              <button type="button" onClick={openLogin}>
                Log in and continue
              </button>
              <button type="button" onClick={openRegister}>
                Create an account
              </button>
            </div>
          </div>
        ) : null}

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
            checkoutLabel={account ? "Next: Checkout" : "Continue as guest"}
            onAccount={account ? undefined : openLogin}
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
            authenticated={Boolean(account)}
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
              rememberBooking(next, {
                movieTitle: movie?.title ?? "",
                venueName: venue?.name ?? summary?.venueName ?? "",
                hall: session?.hall ?? "",
                date: session?.date ?? "",
                time: session?.startTime ?? "",
              });
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
            signedIn={Boolean(account)}
            onTickets={() => {
              onClose();
              navigate("/account");
            }}
            onView={() => {
              onClose();
              navigate(`/booking/${order.reference}`);
            }}
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

function CheckoutStep({
  sessionId,
  hold,
  selected,
  total,
  buyer,
  buyerErrors,
  authenticated,
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
  authenticated: boolean;
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
  const formRef = useRef<HTMLFormElement>(null);
  const focusInvalid = useRef(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });

  function shown(name: string, message?: string) {
    return touched[name] || submitted ? message || "" : "";
  }

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
    setSubmitted(true);
    onFieldErrors(nextBuyerErrors);
    setPaymentErrors(nextPaymentErrors);
    setFormError(null);
    if (Object.keys(nextBuyerErrors).length > 0 || Object.keys(nextPaymentErrors).length > 0) {
      focusInvalid.current = true;
      return;
    }
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
        { auth: authenticated },
      );
      setCardNumber("");
      setCvv("");
      onSuccess(confirmed);
    } catch (error) {
      if (error instanceof PurchaseApiError && error.status === 422 && Object.keys(error.fieldErrors).length === 0) {
        if (error.message === EXPIRED_MESSAGE) onExpired();
        else setFormError(userMessage(error, "The order could not be completed."));
      } else if (error instanceof PurchaseApiError && error.status === 422) {
        const buyerMap: Record<string, string> = {};
        const paymentMap: Record<string, string> = {};
        for (const [key, message] of Object.entries(error.fieldErrors)) {
          if (key === "cardNumber" || key === "expiry" || key === "cvv") paymentMap[key] = message;
          else buyerMap[key] = message;
        }
        onFieldErrors(buyerMap);
        setPaymentErrors(paymentMap);
        focusInvalid.current = true;
      } else if (error instanceof PurchaseApiError && error.status === 401) {
        setFormError(
          authenticated
            ? "Your session expired. Sign in again, then submit this order once."
            : "The cinema service refused this payment because there is no signed-in account. Nothing was charged and no booking was saved.",
        );
      } else if (error instanceof PurchaseApiError && error.conflict === "seats") {
        onSeatConflict(error.conflictingSeatIds, error.message);
      } else {
        setFormError(userMessage(error, "The order could not be completed."));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} className="purchase-checkout" onSubmit={(event) => void onSubmit(event)} noValidate>
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
      <CheckoutField
        label="Full Name"
        name="fullName"
        autoComplete="name"
        value={buyer.fullName}
        error={shown("fullName", buyerErrors.fullName)}
        valid={(touched.fullName || submitted) && !validateBuyer({ ...buyer, fullName: buyer.fullName }).fullName}
        onBlur={() => {
          setTouched((current) => ({ ...current, fullName: true }));
          onFieldErrors({ ...buyerErrors, fullName: validateBuyer(buyer).fullName ?? "" });
        }}
        onChange={(value) => {
          const next = { ...buyer, fullName: value };
          onBuyer(next);
          if (touched.fullName || submitted) onFieldErrors({ ...buyerErrors, fullName: validateBuyer(next).fullName ?? "" });
        }}
      />
      <CheckoutField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={buyer.email}
        error={shown("email", buyerErrors.email)}
        valid={(touched.email || submitted) && !validateBuyer(buyer).email}
        onBlur={() => {
          setTouched((current) => ({ ...current, email: true }));
          onFieldErrors({ ...buyerErrors, email: validateBuyer(buyer).email ?? "" });
        }}
        onChange={(value) => {
          const next = { ...buyer, email: value };
          onBuyer(next);
          if (touched.email || submitted) onFieldErrors({ ...buyerErrors, email: validateBuyer(next).email ?? "" });
        }}
      />
      <CheckoutField
        label="Mobile Number"
        name="mobile"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={buyer.mobile}
        error={shown("mobile", buyerErrors.mobile)}
        valid={(touched.mobile || submitted) && !validateBuyer(buyer).mobile}
        onBlur={() => {
          setTouched((current) => ({ ...current, mobile: true }));
          onFieldErrors({ ...buyerErrors, mobile: validateBuyer(buyer).mobile ?? "" });
        }}
        onChange={(value) => {
          const next = { ...buyer, mobile: value };
          onBuyer(next);
          if (touched.mobile || submitted) onFieldErrors({ ...buyerErrors, mobile: validateBuyer(next).mobile ?? "" });
        }}
      />
      <CheckoutField
        label="Card Number"
        name="cardNumber"
        autoComplete="cc-number"
        inputMode="numeric"
        value={cardNumber}
        error={shown("cardNumber", paymentErrors.cardNumber)}
        valid={(touched.cardNumber || submitted) && !validatePayment({ cardNumber, expiry, cvv }).cardNumber}
        onBlur={() => {
          setTouched((current) => ({ ...current, cardNumber: true }));
          setPaymentErrors((current) => ({ ...current, cardNumber: validatePayment({ cardNumber, expiry, cvv }).cardNumber ?? "" }));
        }}
        onChange={(value) => {
          const digits = digitsOnly(value).slice(0, 16);
          const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
          setCardNumber(formatted);
          if (touched.cardNumber || submitted) {
            setPaymentErrors((current) => ({ ...current, cardNumber: validatePayment({ cardNumber: formatted, expiry, cvv }).cardNumber ?? "" }));
          }
        }}
      />
      <div className="purchase-pay-row">
        <CheckoutField
          label="Expiry"
          name="expiry"
          autoComplete="cc-exp"
          inputMode="numeric"
          placeholder="MM/YY"
          value={expiry}
          error={shown("expiry", paymentErrors.expiry)}
          valid={(touched.expiry || submitted) && !validatePayment({ cardNumber, expiry, cvv }).expiry}
          onBlur={() => {
            setTouched((current) => ({ ...current, expiry: true }));
            setPaymentErrors((current) => ({ ...current, expiry: validatePayment({ cardNumber, expiry, cvv }).expiry ?? "" }));
          }}
          onChange={(value) => {
            const digits = digitsOnly(value).slice(0, 4);
            const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
            setExpiry(formatted);
            if (touched.expiry || submitted) {
              setPaymentErrors((current) => ({ ...current, expiry: validatePayment({ cardNumber, expiry: formatted, cvv }).expiry ?? "" }));
            }
          }}
        />
        <CheckoutField
          label="CVV"
          name="cvv"
          autoComplete="cc-csc"
          inputMode="numeric"
          value={cvv}
          error={shown("cvv", paymentErrors.cvv)}
          valid={(touched.cvv || submitted) && !validatePayment({ cardNumber, expiry, cvv }).cvv}
          onBlur={() => {
            setTouched((current) => ({ ...current, cvv: true }));
            setPaymentErrors((current) => ({ ...current, cvv: validatePayment({ cardNumber, expiry, cvv }).cvv ?? "" }));
          }}
          onChange={(value) => {
            const next = digitsOnly(value).slice(0, 3);
            setCvv(next);
            if (touched.cvv || submitted) {
              setPaymentErrors((current) => ({ ...current, cvv: validatePayment({ cardNumber, expiry, cvv: next }).cvv ?? "" }));
            }
          }}
        />
      </div>
      {formError ? (
        <p className="purchase-warn" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" className="purchase-next" disabled={submitting} aria-busy={submitting}>
        {submitting ? "Processing booking..." : "Pay & Complete Order"}
      </button>
    </form>
  );
}

function CheckoutField({
  label,
  name,
  type = "text",
  value,
  error,
  valid,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  valid: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  autoComplete: string;
  inputMode?: "email" | "tel" | "numeric";
  placeholder?: string;
}) {
  return (
    <label className={`purchase-field${error ? " is-invalid" : valid ? " is-valid" : ""}`}>
      {label}
      <span className="auth-control">
        <input
          type={type}
          name={name}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          className={error ? undefined : valid ? "is-valid" : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <FieldStatus state={error ? "invalid" : valid ? "valid" : "idle"} />
      </span>
      {error ? (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function profileErrors(fullName: string, mobileNumber: string, dateOfBirth: string) {
  const next: Record<string, string> = {};
  if (fullName.trim().length < 3) next.fullName = "Full name must be at least 3 characters.";
  const mobile = mobileNumber.replace(/[\s()-]/g, "");
  if (!/^5\d{8}$/.test(mobile)) next.mobileNumber = "Enter a 9-digit mobile number starting with 5.";
  if (!dateOfBirth) next.dateOfBirth = "Date of birth is required.";
  return next;
}

function ProfileForm() {
  const { account, saveProfile } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const focusInvalid = useRef(false);
  const savingRef = useRef(false);
  const [fullName, setFullName] = useState(account?.fullName ?? "");
  const [mobileNumber, setMobileNumber] = useState(account?.mobileNumber ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(account?.dateOfBirth ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });

  function shown(name: string) {
    return touched[name] || submitted ? errors[name] || "" : "";
  }

  function reveal(name: string, value: { fullName: string; mobileNumber: string; dateOfBirth: string }) {
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => ({ ...current, [name]: profileErrors(value.fullName, value.mobileNumber, value.dateOfBirth)[name] ?? "" }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    const next = profileErrors(fullName, mobileNumber, dateOfBirth);
    setSubmitted(true);
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) {
      focusInvalid.current = true;
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await saveProfile({ fullName, mobileNumber, dateOfBirth });
    } catch (error) {
      if (error instanceof AuthApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
        focusInvalid.current = true;
      } else if (error instanceof AuthApiError && error.status === 401) {
        setFormError("Your session expired. Sign in again, then save your profile.");
      } else {
        setFormError(userMessage(error, "The profile could not be saved."));
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const values = { fullName, mobileNumber, dateOfBirth };
  const mobileError = shown("mobileNumber") || ((touched.mobileNumber || submitted) ? errors.mobile || "" : "");

  return (
    <form ref={formRef} className="purchase-checkout" onSubmit={(event) => void onSubmit(event)} noValidate>
      <p className="purchase-block">Complete your profile before buying tickets.</p>
      <CheckoutField
        label="Full name"
        name="fullName"
        autoComplete="name"
        value={fullName}
        error={shown("fullName")}
        valid={(touched.fullName || submitted) && !profileErrors(fullName, mobileNumber, dateOfBirth).fullName}
        onBlur={() => reveal("fullName", values)}
        onChange={(value) => {
          setFullName(value);
          if (touched.fullName || submitted) reveal("fullName", { ...values, fullName: value });
        }}
      />
      <CheckoutField
        label="Mobile number"
        name="mobileNumber"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={mobileNumber}
        error={mobileError}
        valid={(touched.mobileNumber || submitted) && !profileErrors(fullName, mobileNumber, dateOfBirth).mobileNumber && !errors.mobile}
        onBlur={() => reveal("mobileNumber", values)}
        onChange={(value) => {
          setMobileNumber(value);
          if (touched.mobileNumber || submitted) reveal("mobileNumber", { ...values, mobileNumber: value });
        }}
      />
      <CheckoutField
        label="Date of birth"
        name="dateOfBirth"
        type="date"
        autoComplete="bday"
        value={dateOfBirth}
        error={shown("dateOfBirth")}
        valid={(touched.dateOfBirth || submitted) && !profileErrors(fullName, mobileNumber, dateOfBirth).dateOfBirth}
        onBlur={() => reveal("dateOfBirth", values)}
        onChange={(value) => {
          setDateOfBirth(value);
          if (touched.dateOfBirth || submitted) reveal("dateOfBirth", { ...values, dateOfBirth: value });
        }}
      />
      {formError ? (
        <p className="purchase-warn" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" className="purchase-next" disabled={saving} aria-busy={saving}>
        {saving ? "Saving profile..." : "Save profile"}
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
