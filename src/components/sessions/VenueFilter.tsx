import type { Venue } from "../../types/session";
import CheckOption from "./CheckOption";

interface VenueFilterProps {
  venues: Venue[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function VenueFilter({ venues, selected, onToggle }: VenueFilterProps) {
  return (
    <fieldset className="filter-group">
      <legend>Venue</legend>
      <div className="check-list">
        {venues.map((venue) => (
          <CheckOption
            key={venue.id}
            checked={selected.includes(venue.id)}
            onChange={() => onToggle(venue.id)}
            label={venue.name}
            hint={venue.city}
          />
        ))}
      </div>
    </fieldset>
  );
}
