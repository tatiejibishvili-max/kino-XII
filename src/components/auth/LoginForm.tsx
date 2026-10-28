import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { emailError, passwordError } from "../../lib/auth-form";
import FieldStatus from "../form/FieldStatus";

export function LoginForm({ titleId, onSwitch }: { titleId: string; onSwitch: () => void }) {
  const { login, submitting, formError, fieldErrors } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const focusInvalid = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = { ...fieldErrors, ...localErrors };
  const emailMessage = emailError(email);
  const passwordMessage = passwordError(password);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });

  function reveal(field: string, message: string) {
    setTouched((current) => ({ ...current, [field]: true }));
    setLocalErrors((current) => ({ ...current, [field]: message }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const next = { email: emailMessage, password: passwordMessage };
    setSubmitted(true);
    setTouched({ email: true, password: true });
    if (next.email || next.password) {
      setLocalErrors(next);
      focusInvalid.current = true;
      return;
    }
    setLocalErrors({});
    void login(email.trim(), password);
  }

  return (
    <form ref={formRef} className="auth-form" onSubmit={onSubmit} noValidate>
      <h2 id={titleId}>Log In</h2>
      <p className="auth-lead">Use the email and password for your KINO XII account.</p>
      {formError ? <p className="auth-banner">{formError}</p> : null}
      <LoginField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        error={touched.email || submitted ? errors.email : ""}
        valid={(touched.email || submitted) && !emailMessage && !errors.email}
        errorId="login-email-error"
        onChange={(value) => {
          setEmail(value);
          if (touched.email || submitted) setLocalErrors((current) => ({ ...current, email: emailError(value) }));
        }}
        onBlur={() => reveal("email", emailMessage)}
      />
      <LoginField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        error={touched.password || submitted ? errors.password : ""}
        valid={(touched.password || submitted) && !passwordMessage && !errors.password}
        errorId="login-password-error"
        onChange={(value) => {
          setPassword(value);
          if (touched.password || submitted) setLocalErrors((current) => ({ ...current, password: passwordError(value) }));
        }}
        onBlur={() => reveal("password", passwordMessage)}
      />
      <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? "Signing in..." : "Log In"}
      </button>
      <p className="auth-switch">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Sign Up
        </button>
      </p>
    </form>
  );
}

function LoginField({
  label,
  name,
  type = "text",
  autoComplete,
  value,
  error,
  valid,
  errorId,
  onChange,
  onBlur,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  value: string;
  error?: string;
  valid: boolean;
  errorId: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const state = error ? "is-invalid" : valid ? "is-valid" : "";
  return (
    <div className={`auth-field ${state}`.trim()}>
      <label>
        {label}
        <span className="auth-control">
          <input
            type={type}
            name={name}
            autoComplete={autoComplete}
            value={value}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
          <FieldStatus state={error ? "invalid" : valid ? "valid" : "idle"} />
        </span>
      </label>
      {error ? (
        <p id={errorId} className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
