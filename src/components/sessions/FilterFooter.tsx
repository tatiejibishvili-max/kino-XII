interface FilterFooterProps {
  activeCount: number;
  canClear: boolean;
  onClear: () => void;
}

export default function FilterFooter({ activeCount, canClear, onClear }: FilterFooterProps) {
  const label = activeCount === 1 ? "filter" : "filters";

  return (
    <div className="filter-footer">
      <button type="button" className="clear-filters" onClick={onClear} disabled={!canClear}>
        Clear All Filters
      </button>
      <p className="filter-count">
        {activeCount} {label} active
      </p>
    </div>
  );
}
