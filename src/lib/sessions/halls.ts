import type { HallSessionGroup, Session, SessionCatalog } from "../../types/session";
import { toSessionView } from "./query";

export function groupByHall(sessions: Session[], catalog: SessionCatalog): HallSessionGroup[] {
  const ordered = [...sessions].sort(
    (left, right) => left.startTime.localeCompare(right.startTime) || left.id.localeCompare(right.id),
  );
  const groups = new Map<string, HallSessionGroup>();

  for (const session of ordered) {
    const view = toSessionView(session, catalog);
    const key = `${view.venueName}\u0000${view.hall}`;
    const group = groups.get(key);

    if (group) {
      group.sessions.push(view);
    } else {
      groups.set(key, { venueName: view.venueName, hall: view.hall, sessions: [view] });
    }
  }

  return [...groups.values()].sort(
    (left, right) => left.venueName.localeCompare(right.venueName) || left.hall.localeCompare(right.hall),
  );
}
