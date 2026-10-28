import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { avatarError, confirmError, emailError, passwordError, usernameError } from "../../lib/auth-form";
import FieldStatus from "../form/FieldStatus";

export function RegisterForm({ titleId, onSwitch }: { titleId: string; onSwitch: () => void }) {
  const { register, submitting, formError, fieldErrors } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const focusInvalid = useRef(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const previewRef = useRef<string | null>(null);

  const errors = { ...fieldErrors, ...localErrors };
  const shown = (field: string) => Boolean((touched[field] || submitted) && errors[field]);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function replacePreview(next: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreviewUrl(next);
  }

  function onAvatar(file: File | null) {
    if (!file) {
      setAvatar(null);
      replacePreview(null);
      setLocalErrors((current) => ({ ...current, avatar: "" }));
      return;
    }
    const message = avatarError(file);
    if (message) {
      setLocalErrors((current) => ({ ...current, avatar: message }));
      return;
    }
    setAvatar(file);
    replacePreview(URL.createObjectURL(file));
    setLocalErrors((current) => ({ ...current, avatar: "" }));
  }

  function reveal(field: string, message: string) {
    setTouched((current) => ({ ...current, [field]: true }));
    setLocalErrors((current) => ({ ...current, [field]: message }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const next: Record<string, string> = {
      username: usernameError(username),
      email: emailError(email),
      password: passwordError(password),
      confirmPassword: confirmError(password, confirmPassword),
    };
    if (avatar) next.avatar = avatarError(avatar);
    setSubmitted(true);
    setTouched({ username: true, email: true, password: true, confirmPassword: true, avatar: true });
    const invalid = Object.values(next).some(Boolean);
    setLocalErrors(invalid ? next : {});
    if (invalid) {
      focusInvalid.current = true;
      return;
    }
    void register({
      username: username.trim(),
      email: email.trim(),
      password,
      avatar,
    });
  }

  const usernameReady = (touched.username || submitted) && !usernameError(username) && !errors.username;
  const emailReady = (touched.email || submitted) && emailError(email) === "" && !errors.email;
  const passwordReady = (touched.password || submitted) && passwordError(password) === "" && !errors.password;
  const confirmReady = (touched.confirmPassword || submitted) && confirmError(password, confirmPassword) === "" && !errors.confirmPassword;

  return (
    <form ref={formRef} className="auth-form auth-form--register" onSubmit={onSubmit} noValidate>
      <h2 id={titleId}>Sign up</h2>
      <p className="auth-lead">Welcome to Kino XII</p>
      {formError ? <p className="auth-banner">{formError}</p> : null}
      <div className="auth-avatar">
        <label className="auth-avatar-hit">
          <span className="auth-avatar-thumb">
            {previewUrl ? <img src={previewUrl} alt="" /> : <AvatarMark />}
          </span>
          <span className="auth-avatar-copy">
            <strong>Upload avatar (optional)</strong>
            <span>JPG, PNG or WEBP</span>
          </span>
          <input
            className="auth-avatar-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            aria-label="Upload avatar (optional)"
            aria-invalid={Boolean(errors.avatar)}
            aria-describedby={errors.avatar ? "register-avatar-error" : undefined}
            onChange={(event) => onAvatar(event.target.files?.[0] ?? null)}
          />
        </label>
        {previewUrl ? (
          <button
            type="button"
            className="auth-avatar-remove"
            onClick={() => {
              onAvatar(null);
              const input = dialogInput();
              if (input) input.value = "";
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      {errors.avatar ? (
        <p id="register-avatar-error" className="auth-error" role="alert">
          {errors.avatar}
        </p>
      ) : null}
      <RegisterField
        label="Username"
        name="username"
        autoComplete="username"
        placeholder="User"
        value={username}
        error={shown("username") ? errors.username : ""}
        errorId="register-username-error"
        ready={usernameReady}
        onBlur={() => reveal("username", usernameError(username))}
        onChange={(value) => {
          setUsername(value);
          if (touched.username || submitted) setLocalErrors((current) => ({ ...current, username: usernameError(value) }));
        }}
      />
      <RegisterField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="example@gmail.com"
        value={email}
        error={shown("email") ? errors.email : ""}
        errorId="register-email-error"
        ready={emailReady}
        onBlur={() => reveal("email", emailError(email))}
        onChange={(value) => {
          setEmail(value);
          if (touched.email || submitted) setLocalErrors((current) => ({ ...current, email: emailError(value) }));
        }}
      />
      <div className="auth-split">
        <RegisterField
          label="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={shown("password") ? errors.password : ""}
          errorId="register-password-error"
          ready={passwordReady}
          onBlur={() => reveal("password", passwordError(password))}
        onChange={(value) => {
          setPassword(value);
          setLocalErrors((current) => {
            const next = { ...current };
            if (touched.password || submitted) next.password = passwordError(value);
            if (touched.confirmPassword || submitted) next.confirmPassword = confirmError(value, confirmPassword);
            return next;
          });
        }}
        />
        <RegisterField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          error={shown("confirmPassword") ? errors.confirmPassword : ""}
          errorId="register-confirm-error"
          ready={confirmReady}
          onBlur={() => reveal("confirmPassword", confirmError(password, confirmPassword))}
          onChange={(value) => {
            setConfirmPassword(value);
            if (touched.confirmPassword || submitted) setLocalErrors((current) => ({ ...current, confirmPassword: confirmError(password, value) }));
          }}
        />
      </div>
      <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? "Creating account..." : "Sign up"}
      </button>
      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Log in
        </button>
      </p>
    </form>
  );
}

function RegisterField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  value,
  error,
  errorId,
  ready,
  onChange,
  onBlur,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder?: string;
  value: string;
  error?: string;
  errorId: string;
  ready: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const state = error ? "is-invalid" : ready ? "is-valid" : "";
  return (
    <div className={`auth-field ${state}`.trim()}>
      <label>
        {label}
        <span className="auth-control">
          <input
            type={type}
            name={name}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={value}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
          <FieldStatus state={error ? "invalid" : ready ? "valid" : "idle"} />
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

function AvatarMark() {
  return (
    <svg className="auth-avatar-fallback" viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#6D4DFF" />
      <circle cx="14" cy="11" r="4" fill="#F3D2C4" />
      <path d="M6.5 23.2c1.4-4 4-5.8 7.5-5.8s6.1 1.8 7.5 5.8" fill="#F3D2C4" />
    </svg>
  );
}

function dialogInput() {
  return document.querySelector<HTMLInputElement>(".auth-dialog input[type='file']");
}
