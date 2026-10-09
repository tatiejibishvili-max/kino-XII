import type { FormatId, LanguageId, SessionCatalog, SessionsFilters as Filters, TimeOfDayId } from "../../types/session";
import DateFilter from "./DateFilter";
import FilterFooter from "./FilterFooter";
import FormatFilter from "./FormatFilter";
import LanguageFilter from "./LanguageFilter";
import TimeOfDayFilter from "./TimeOfDayFilter";
import VenueFilter from "./VenueFilter";

interface SessionsFiltersProps {
  catalog: SessionCatalog;
  filters: Filters;
  formatOptions: FormatId[];
  activeCount: number;
  canClear: boolean;
  open: boolean;
  onClose: () => void;
  onToggleVenue: (id: string) => void;
  onToggleFormat: (id: FormatId) => void;
  onToggleLanguage: (id: LanguageId) => void;
  onToggleTime: (id: TimeOfDayId) => void;
  onSelectDate: (date: string) => void;
  onClear: () => void;
}

export default function SessionsFilters({
  catalog,
  filters,
  formatOptions,
  activeCount,
  canClear,
  open,
  onClose,
  onToggleVenue,
  onToggleFormat,
  onToggleLanguage,
  onToggleTime,
  onSelectDate,
  onClear,
}: SessionsFiltersProps) {
  return (
    <aside className={open ? "sessions-filters is-open" : "sessions-filters"} aria-label="Session filters">
      <div className="filters-card">
        <div className="filters-heading">
          <h2>Filters</h2>
          <button type="button" className="filters-close" onClick={onClose}>
            Close
          </button>
        </div>
        <VenueFilter venues={catalog.venues} selected={filters.venues} onToggle={onToggleVenue} />
        <DateFilter dates={catalog.dates} today={catalog.today} selected={filters.date} onSelect={onSelectDate} />
        <FormatFilter available={formatOptions} selected={filters.formats} onToggle={onToggleFormat} />
        <LanguageFilter selected={filters.languages} onToggle={onToggleLanguage} />
        <TimeOfDayFilter selected={filters.times} onToggle={onToggleTime} />
        <FilterFooter activeCount={activeCount} canClear={canClear} onClear={onClear} />
      </div>
    </aside>
  );
}
