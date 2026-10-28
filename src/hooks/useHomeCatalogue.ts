import { useEffect, useState } from "react";
import { loadHomeCatalogue } from "../services/movies";
import type { HomeCatalogue } from "../types/movie";

interface HomeCatalogueState {
  status: "loading" | "ready" | "error";
  data: HomeCatalogue | null;
  retry: () => void;
}

export function useHomeCatalogue(): HomeCatalogueState {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<HomeCatalogueState["status"]>("loading");
  const [data, setData] = useState<HomeCatalogue | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadHomeCatalogue()
      .then((catalogue) => {
        if (!cancelled) {
          setData(catalogue);
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
      setStatus("loading");
      setData(null);
      setAttempt((value) => value + 1);
    },
  };
}
