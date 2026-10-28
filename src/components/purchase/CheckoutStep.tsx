import { useEffect, useRef, useState, type FormEvent } from "react";
import FieldStatus from "../form/FieldStatus";
import { digitsOnly, EXPIRED_MESSAGE, formatHoldRemaining, formatLari, holdExpired, seatAmount, validateBuyer, validatePayment } from "../../lib/purchase";
import { userMessage } from "../../lib/userMessage";
import { PurchaseApiError, submitOrder } from "../../services/purchase";
import type { BuyerDetails, ConfirmedOrder, SeatHold, SelectedSeat } from "../../types/purchase";

export function CheckoutStep({
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
      if (error instanceof PurchaseApiError && error.status === 422 && (error.message === EXPIRED_MESSAGE || error.fieldErrors.holdId)) {
        onExpired();
      } else if (error instanceof PurchaseApiError && error.status === 422 && Object.keys(error.fieldErrors).length === 0) {
        setFormError(userMessage(error, "The order could not be completed."));
      } else if (error instanceof PurchaseApiError && error.status === 422) {
        const buyerMap: Record<string, string> = {};
        const paymentMap: Record<string, string> = {};
        for (const [key, message] of Object.entries(error.fieldErrors)) {
          if (key === "cardNumber" || key === "expiry" || key === "cvv") paymentMap[key] = message;
          else buyerMap[key] = message;
        }
        const highlightsField = Object.keys(paymentMap).length > 0 || Object.keys(buyerMap).some((key) => key === "fullName" || key === "email" || key === "mobile" || key === "mobileNumber");
        onFieldErrors(buyerMap);
        setPaymentErrors(paymentMap);
        if (highlightsField) focusInvalid.current = true;
        else setFormError(userMessage(error, "The order could not be completed."));
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

export function CheckoutField({
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
