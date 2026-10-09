import { describeDate } from "../../lib/sessions/dates";

interface DateFilterProps {
  dates: string[];
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}

export default function DateFilter({ dates, today, selected, onSelect }: DateFilterProps) {
  return (
    <fieldset className="filter-group">
      <legend>Date</legend>
      <div className="date-row" role="radiogroup" aria-label="Session date">
        {dates.map((date) => {
          const parts = describeDate(date, today);
          const isSelected = date === selected;

          return (
            <button
              key={date}
              type="button"
              className="date-chip"
              data-date={date}
              role="radio"
              aria-checked={isSelected}
              aria-pressed={isSelected}
              onClick={() => onSelect(date)}
            >
              <span>{parts.caption}</span>
              <strong>{parts.day}</strong>
              <span>{parts.month}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
