import { buildSessionCatalog } from "../data/sessionCatalog";
import type { SessionCatalog } from "../types/session";

let catalogRequest: Promise<SessionCatalog> | null = null;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Loads the session catalog. Swap this body for an API call when a backend exists. */
export function loadSessionCatalog(): Promise<SessionCatalog> {
  if (!catalogRequest) {
    catalogRequest = wait(180)
      .then(() => buildSessionCatalog(new Date()))
      .catch((error: unknown) => {
        catalogRequest = null;
        throw error;
      });
  }

  return catalogRequest;
}

export function resetSessionCatalog() {
  catalogRequest = null;
}
