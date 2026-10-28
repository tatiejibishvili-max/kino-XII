import { useEffect, useState } from "react";
import { userMessage } from "../lib/userMessage";
import { searchTitles } from "../services/search";
import type { SearchResult } from "../types/movie";

export function useCatalogueSearch(query: string) {
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loaded, setLoaded] = useState<{ term: string; results: SearchResult[] } | null>(null);
  const [failure, setFailure] = useState<{ term: string; message: string } | null>(null);
  const term = query.trim();
  const results = failure?.term === term ? [] : loaded?.term === term ? loaded.results : [];
  const message = failure?.term === term ? failure.message : "";
  const settled = status !== "loading" && (loaded?.term === term || failure?.term === term);

  useEffect(() => {
    if (!term) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      searchTitles(term)
        .then((next) => {
          if (cancelled) return;
          setLoaded({ term, results: next });
          setFailure(null);
          setActive(0);
          setStatus("ready");
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setFailure({ term, message: userMessage(error, "Search could not be completed.") });
          setStatus("error");
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  return { term, results, message, settled, active, setActive };
}
