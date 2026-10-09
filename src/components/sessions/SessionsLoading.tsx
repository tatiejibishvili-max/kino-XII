export default function SessionsLoading() {
  return (
    <div className="sessions-loading" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading sessions</span>
      <div className="skeleton skeleton-sidebar" />
      <div className="skeleton-results">
        <div className="skeleton skeleton-toolbar" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    </div>
  );
}

export function SessionsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="empty-sessions">
      <h2>Sessions could not be loaded</h2>
      <p>Check the connection and try again.</p>
      <button type="button" className="clear-filters" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
