import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { AuthApiError } from "../services/auth";
import { ApiError } from "../services/api";
import { fetchTickets, refundTicket } from "../services/tickets";
import type { TicketOrder } from "../types/purchase";
import { formatLari } from "../lib/purchase";
import { userMessage } from "../lib/userMessage";

const MOBILE_PATTERN = /^5\d{8}$/;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function memberSince(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function profileFieldErrors(fullName: string, mobileNumber: string, dateOfBirth: string) {
  const errors: Record<string, string> = {};
  if (fullName.trim().length < 3) errors.fullName = "Full name must be at least 3 characters.";
  const mobile = mobileNumber.replace(/[\s()-]/g, "");
  if (!MOBILE_PATTERN.test(mobile)) errors.mobileNumber = "Enter a 9-digit mobile number starting with 5.";
  if (!dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
  return errors;
}

export default function AccountPage() {
  const { account, sessionReady, openLogin, logout } = useAuth();
  const signedOut = useRef(false);

  useEffect(() => {
    if (sessionReady && !account && !signedOut.current) openLogin();
  }, [account, openLogin, sessionReady]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Account · KINO XII";
    return () => {
      document.title = previous;
    };
  }, []);

  if (!sessionReady) {
    return (
      <div className="page account-page">
        <Header variant="solid" />
        <main className="account-main" aria-busy="true">
          <p className="sr-only">Loading account</p>
          <div className="skeleton account-skel" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!account) return <Navigate to="/" replace />;

  return (
    <div className="page account-page">
      <Header variant="solid" />
      <main className="account-main">
        <ProfilePanel
          onLogout={() => {
            signedOut.current = true;
            logout();
          }}
        />
        <BookingHistory />
      </main>
      <Footer />
    </div>
  );
}

function ProfilePanel({ onLogout }: { onLogout: () => void }) {
  const { account, saveProfile } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const focusInvalid = useRef(false);
  const name = account?.fullName || account?.username || "Account";
  const since = memberSince(account?.createdAt ?? null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(account?.fullName ?? "");
  const [mobileNumber, setMobileNumber] = useState(account?.mobileNumber ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(account?.dateOfBirth ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });

  if (!account) return null;

  function shown(field: string) {
    return touched[field] || submitted ? errors[field] || "" : "";
  }

  function reveal(field: string, nextName = fullName, nextMobile = mobileNumber, nextBirth = dateOfBirth) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: profileFieldErrors(nextName, nextMobile, nextBirth)[field] ?? "" }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    const next = profileFieldErrors(fullName, mobileNumber, dateOfBirth);
    setSubmitted(true);
    setErrors(next);
    setFormError(null);
    setSaved(false);
    if (Object.keys(next).length > 0) {
      focusInvalid.current = true;
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await saveProfile({ fullName, mobileNumber, dateOfBirth, avatar });
      setSaved(true);
      setEditing(false);
      setAvatar(null);
    } catch (error) {
      if (error instanceof AuthApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
        focusInvalid.current = true;
      } else {
        setFormError(userMessage(error, "The profile could not be saved."));
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="account-card" aria-labelledby="account-heading">
      <div className="account-identity">
        {account.avatarUrl ? (
          <img className="account-avatar" src={account.avatarUrl} alt="" />
        ) : (
          <span className="account-avatar" aria-hidden="true">
            {initials(name)}
          </span>
        )}
        <div>
          <h1 id="account-heading">{name}</h1>
          <p>{account.email}</p>
          {since ? <p>Member since {since}</p> : null}
          {account.profileComplete === false ? <p className="account-note">Add your name, mobile number, and date of birth before buying tickets.</p> : null}
        </div>
      </div>

      {editing ? (
        <form ref={formRef} className="account-form" onSubmit={(event) => void onSubmit(event)} noValidate>
          <label>
            Full name
            <input
              name="fullName"
              autoComplete="name"
              value={fullName}
              aria-invalid={Boolean(shown("fullName"))}
              aria-describedby={shown("fullName") ? "account-name-error" : undefined}
              onBlur={() => reveal("fullName")}
              onChange={(event) => {
                const value = event.target.value;
                setFullName(value);
                if (touched.fullName || submitted) reveal("fullName", value);
              }}
            />
          </label>
          {shown("fullName") ? (
            <p id="account-name-error" className="field-error" role="alert">
              {shown("fullName")}
            </p>
          ) : null}
          <label>
            Email
            <input name="email" value={account.email} readOnly />
          </label>
          <p className="account-hint">Email is set when you register and stays on this account.</p>
          <label>
            Mobile number
            <input
              name="mobileNumber"
              autoComplete="tel"
              inputMode="tel"
              value={mobileNumber}
              aria-invalid={Boolean(shown("mobileNumber"))}
              aria-describedby={shown("mobileNumber") ? "account-mobile-error" : undefined}
              onBlur={() => reveal("mobileNumber")}
              onChange={(event) => {
                const value = event.target.value;
                setMobileNumber(value);
                if (touched.mobileNumber || submitted) reveal("mobileNumber", fullName, value);
              }}
            />
          </label>
          {shown("mobileNumber") ? (
            <p id="account-mobile-error" className="field-error" role="alert">
              {shown("mobileNumber")}
            </p>
          ) : null}
          <label>
            Date of birth
            <input
              type="date"
              name="dateOfBirth"
              autoComplete="bday"
              value={dateOfBirth}
              aria-invalid={Boolean(shown("dateOfBirth"))}
              aria-describedby={shown("dateOfBirth") ? "account-birth-error" : undefined}
              onBlur={() => reveal("dateOfBirth")}
              onChange={(event) => {
                const value = event.target.value;
                setDateOfBirth(value);
                if (touched.dateOfBirth || submitted) reveal("dateOfBirth", fullName, mobileNumber, value);
              }}
            />
          </label>
          {shown("dateOfBirth") ? (
            <p id="account-birth-error" className="field-error" role="alert">
              {shown("dateOfBirth")}
            </p>
          ) : null}
          <label>
            Avatar
            <input
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
            />
          </label>
          {formError ? (
            <p className="field-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="account-actions">
            <button type="submit" className="account-primary" disabled={saving} aria-busy={saving}>
              {saving ? "Saving profile..." : "Save profile"}
            </button>
            <button type="button" className="account-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="account-actions">
          <button type="button" className="account-primary" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        </div>
      )}
      <div className="account-actions">
        <button type="button" className="account-secondary" onClick={onLogout}>
          Log out
        </button>
      </div>
      {saved ? <p role="status">Profile saved.</p> : null}
      <div className="account-password">
        <h2>Password</h2>
        <p>This cinema service has no password change. Keep using the password from registration.</p>
      </div>
    </section>
  );
}

function BookingHistory() {
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
