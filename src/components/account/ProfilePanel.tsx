import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { userMessage } from "../../lib/userMessage";
import { AuthApiError } from "../../services/auth";

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

export function ProfilePanel({ onLogout }: { onLogout: () => void }) {
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
