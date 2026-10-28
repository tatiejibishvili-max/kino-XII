import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { userMessage } from "../../lib/userMessage";
import { AuthApiError } from "../../services/auth";
import { CheckoutField } from "./CheckoutStep";

function profileErrors(fullName: string, mobileNumber: string, dateOfBirth: string) {
  const next: Record<string, string> = {};
  if (fullName.trim().length < 3) next.fullName = "Full name must be at least 3 characters.";
  const mobile = mobileNumber.replace(/[\s()-]/g, "");
  if (!/^5\d{8}$/.test(mobile)) next.mobileNumber = "Enter a 9-digit mobile number starting with 5.";
  if (!dateOfBirth) next.dateOfBirth = "Date of birth is required.";
  return next;
}

export function ProfileForm() {
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
