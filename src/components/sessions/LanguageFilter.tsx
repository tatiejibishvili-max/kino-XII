import { LANGUAGES } from "../../data/sessionOptions";
import type { LanguageId } from "../../types/session";
import CheckOption from "./CheckOption";

interface LanguageFilterProps {
  selected: LanguageId[];
  onToggle: (id: LanguageId) => void;
}

export default function LanguageFilter({ selected, onToggle }: LanguageFilterProps) {
  return (
    <fieldset className="filter-group">
      <legend>Language</legend>
      <div className="check-list">
        {LANGUAGES.map((language) => (
          <CheckOption
            key={language.id}
            checked={selected.includes(language.id)}
            onChange={() => onToggle(language.id)}
            label={language.label}
            lang="ka"
          />
        ))}
      </div>
    </fieldset>
  );
}
