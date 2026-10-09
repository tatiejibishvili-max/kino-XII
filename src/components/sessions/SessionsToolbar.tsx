import { SORTS } from "../../data/sessionOptions";
import type { SortId } from "../../types/session";

interface SessionsToolbarProps {
  totalSessions: number;
  sort: SortId;
  activeCount: number;
  onSort: (sort: SortId) => void;
  onOpenFilters: () => void;
}

export default function SessionsToolbar({ totalSessions, sort, activeCount, onSort, onOpenFilters }: SessionsToolbarProps) {
  const countLabel = totalSessions === 0 ? "No sessions found" : `Showing ${totalSessions} sessions`;

  return (
    <div className="sessions-toolbar">
      <button type="button" className="filters-toggle" onClick={onOpenFilters}>
        Filters
        {activeCount > 0 ? <span className="filters-badge">{activeCount}</span> : null}
      </button>
      <p className="results-count" aria-live="polite">
        {countLabel}
      </p>
      <label className="sort-control">
        <span>Sort</span>
        <select aria-label="Sort sessions" value={sort} onChange={(event) => onSort(event.target.value as SortId)}>
          {SORTS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
