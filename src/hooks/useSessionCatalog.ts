import { useEffect, useState } from "react";
import { loadSessionCatalog, resetSessionCatalog } from "../services/sessions";
import type { SessionCatalog } from "../types/session";

interface CatalogState {
  status: "loading" | "ready" | "error";
  data: SessionCatalog | null;
  retry: () => void;
}

export function useSessionCatalog(): CatalogState {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<CatalogState["status"]>("loading");
  const [data, setData] = useState<SessionCatalog | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadSessionCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setData(catalog);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return {
    status,
    data,
    retry: () => {
      resetSessionCatalog();
      setStatus("loading");
      setData(null);
      setAttempt((value) => value + 1);
    },
  };
}
