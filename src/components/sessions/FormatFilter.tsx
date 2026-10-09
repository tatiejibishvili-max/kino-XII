import { FORMATS } from "../../data/sessionOptions";
import type { FormatId } from "../../types/session";
import CheckOption from "./CheckOption";

interface FormatFilterProps {
  available: FormatId[];
  selected: FormatId[];
  onToggle: (id: FormatId) => void;
}

export default function FormatFilter({ available, selected, onToggle }: FormatFilterProps) {
  const options = FORMATS.filter((format) => available.includes(format.id));

  return (
    <fieldset className="filter-group">
      <legend>Format</legend>
      <div className="check-list">
        {options.map((format) => (
          <CheckOption
            key={format.id}
            checked={selected.includes(format.id)}
            onChange={() => onToggle(format.id)}
            label={format.label}
          />
        ))}
      </div>
    </fieldset>
  );
}
