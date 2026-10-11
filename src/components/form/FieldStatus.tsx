export default function FieldStatus({ state }: { state: "valid" | "invalid" | "idle" }) {
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
