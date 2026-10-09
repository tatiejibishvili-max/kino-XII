interface EmptySessionsProps {
  canClear: boolean;
  onClear: () => void;
}

export default function EmptySessions({ canClear, onClear }: EmptySessionsProps) {
  return (
    <div className="empty-sessions">
      <h2>No sessions found</h2>
      <p>Try another date or clear the filters to see more showtimes.</p>
      <button type="button" className="clear-filters" onClick={onClear} disabled={!canClear}>
        Clear All Filters
      </button>
    </div>
  );
}
