import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function emailError(value: string) {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
  return "";
}

function passwordError(value: string) {
  if (!value) return "Password is required.";
  if (value.length < 3) return "Password must be at least 3 characters.";
  return "";
}

function avatarError(file: File) {
  if (file.size > 2 * 1024 * 1024) return "Avatar must be 2MB or smaller.";
  const extension = file.name.toLowerCase();
  const extensionOk = [".jpg", ".jpeg", ".png", ".webp"].some((item) => extension.endsWith(item));
  if (file.type) return ACCEPTED_TYPES.has(file.type) ? "" : "Use a JPG, JPEG, PNG, or WebP image.";
  return extensionOk ? "" : "Use a JPG, JPEG, PNG, or WebP image.";
}

export default function AuthModal() {
  const { modal, closeModal, openLogin, openRegister, notice, dismissNotice } = useAuth();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.querySelector<HTMLElement>(".auth-form input:not([type='file'])")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal, modal]);

  return (
    <>
      {notice ? (
        <div className="auth-notice" role="status">
          <p>{notice}</p>
          <button type="button" onClick={dismissNotice}>
            Dismiss
          </button>
        </div>
      ) : null}
      {modal ? (
        <div
          className={modal === "register" ? "auth-backdrop auth-backdrop--register" : "auth-backdrop"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            ref={dialogRef}
            className={modal === "register" ? "auth-dialog auth-dialog--register" : "auth-dialog"}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="auth-close" aria-label="Close" onClick={closeModal}>
              ×
            </button>
            {modal === "login" ? (
              <LoginForm titleId={titleId} onSwitch={openRegister} />
            ) : (
              <RegisterForm titleId={titleId} onSwitch={openLogin} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function LoginForm({ titleId, onSwitch }: { titleId: string; onSwitch: () => void }) {
  const { login, submitting, formError, fieldErrors } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errors = { ...localErrors, ...fieldErrors };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = {
      email: emailError(email),
      password: passwordError(password),
    };
    const visible = Object.fromEntries(Object.entries(next).filter(([, message]) => message));
    setLocalErrors(visible);
    if (Object.keys(visible).length > 0) return;
    void login(email.trim(), password);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <h2 id={titleId}>Log In</h2>
      <p className="auth-lead">Use the email and password for your KINO XII account.</p>
      {formError ? <p className="auth-banner">{formError}</p> : null}
      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {errors.email ? <p id="login-email-error" className="auth-error">{errors.email}</p> : null}
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {errors.password ? <p id="login-password-error" className="auth-error">{errors.password}</p> : null}
      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? "Logging in…" : "Log In"}
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

function RegisterForm({ titleId, onSwitch }: { titleId: string; onSwitch: () => void }) {
  const { register, submitting, formError, fieldErrors } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const previewRef = useRef<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!username.trim()) next.username = "Username is required.";
    else if (username.trim().length < 3) next.username = "Username must be at least 3 characters.";
    const emailMessage = emailError(email);
    if (emailMessage) next.email = emailMessage;
    const passwordMessage = passwordError(password);
    if (passwordMessage) next.password = passwordMessage;
    if (!confirmPassword) next.confirmPassword = "Confirm your password.";
    else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    if (avatar) {
      const avatarMessage = avatarError(avatar);
      if (avatarMessage) next.avatar = avatarMessage;
    }
    setLocalErrors(next);
    if (Object.keys(next).filter((key) => next[key]).length > 0) return;
    void register({
      username: username.trim(),
      email: email.trim(),
      password,
      avatar,
    });
  }

  const usernameReady = username.trim().length >= 3 && !errors.username;
  const emailReady = emailError(email) === "" && !errors.email;
  const passwordReady = passwordError(password) === "" && !errors.password;
  const confirmReady = confirmPassword.length > 0 && confirmPassword === password && passwordReady && !errors.confirmPassword;

  return (
    <form className="auth-form auth-form--register" onSubmit={onSubmit} noValidate>
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
      {errors.avatar ? <p id="register-avatar-error" className="auth-error">{errors.avatar}</p> : null}
      <RegisterField
        label="Username"
        name="username"
        autoComplete="username"
        placeholder="User"
        value={username}
        error={errors.username}
        errorId="register-username-error"
        ready={usernameReady}
        onChange={setUsername}
      />
      <RegisterField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="example@gmail.com"
        value={email}
        error={errors.email}
        errorId="register-email-error"
        ready={emailReady}
        onChange={setEmail}
      />
      <div className="auth-split">
        <RegisterField
          label="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          errorId="register-password-error"
          ready={passwordReady}
          onChange={setPassword}
        />
        <RegisterField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          error={errors.confirmPassword}
          errorId="register-confirm-error"
          ready={confirmReady}
          onChange={setConfirmPassword}
        />
      </div>
      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? "Signing up…" : "Sign up"}
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
          />
          <FieldStatus state={error ? "invalid" : ready ? "valid" : "idle"} />
        </span>
      </label>
      {error ? (
        <p id={errorId} className="auth-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FieldStatus({ state }: { state: "valid" | "invalid" | "idle" }) {
  if (state === "idle") return null;
  if (state === "valid") {
    return (
      <span className="auth-status auth-status--valid" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2.2 6.1 L4.7 8.5 L9.8 3.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="auth-status auth-status--invalid" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 3.4 V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="6" cy="8.4" r="0.7" fill="currentColor" />
      </svg>
    </span>
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
