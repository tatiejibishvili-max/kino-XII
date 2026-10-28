import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { FORMATS } from "../../data/sessionOptions";
import { useSessionCatalog } from "../../hooks/useSessionCatalog";
import {
  EXPIRED_MESSAGE,
  availabilityViolations,
  changeTicketType,
  holdExpired,
  profileBlock,
  purchaseAgeBlock,
  removeLostSeats,
  subtotal,
  ticketViolations,
  toggleSeat,
} from "../../lib/purchase";
import { useDialog } from "../../lib/useDialog";
import { userMessage } from "../../lib/userMessage";
import { usePurchase } from "../../purchase/usePurchase";
import { rememberBooking } from "../../services/bookings";
import { buyerFromAccount, fetchHallMap, holdSeats, PurchaseApiError, releaseHold } from "../../services/purchase";
import { loadSessionSummary } from "../../services/sessions";
import type { BuyerDetails, ConfirmedOrder, HallMap, SeatHold, SelectedSeat } from "../../types/purchase";
import type { SessionSummary } from "../../types/session";
import { CheckoutStep } from "./CheckoutStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { ProfileForm } from "./ProfileForm";
import { SeatStep } from "./SeatStep";

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
