import { TIMES } from "../../data/sessionOptions";
import type { TimeOfDayId } from "../../types/session";
import CheckOption from "./CheckOption";

interface TimeOfDayFilterProps {
  selected: TimeOfDayId[];
  onToggle: (id: TimeOfDayId) => void;
}

export default function TimeOfDayFilter({ selected, onToggle }: TimeOfDayFilterProps) {
  return (
    <fieldset className="filter-group">
      <legend>Time of day</legend>
      <div className="check-list">
        {TIMES.map((time) => (
          <CheckOption
            key={time.id}
            checked={selected.includes(time.id)}
            onChange={() => onToggle(time.id)}
            label={time.label}
            hint={time.hint}
            lang="ka"
          />
        ))}
      </div>
    </fieldset>
  );
}
