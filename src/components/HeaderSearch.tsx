import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userMessage } from "../lib/userMessage";
import { formatSessionPrice } from "../lib/sessions/query";
import { searchTitles } from "../services/movies";
import type { SearchResult } from "../types/movie";
import { SearchIcon } from "./Icons";

function resultLabel(result: SearchResult) {
  if (result.isComingSoon) return "Coming soon";
  if (result.kind === "event") return "Live event";
  return result.genre;
}

export default function HeaderSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loaded, setLoaded] = useState<{ term: string; results: SearchResult[] } | null>(null);
  const [failure, setFailure] = useState<{ term: string; message: string } | null>(null);
  const term = query.trim();
  const results = failure?.term === term ? [] : loaded?.term === term ? loaded.results : [];
  const message = failure?.term === term ? failure.message : "";
  const settled = status !== "loading" && (loaded?.term === term || failure?.term === term);
  const showPanel = open && term.length > 0;

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
          setOpen(true);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setFailure({ term, message: userMessage(error, "Search could not be completed.") });
          setStatus("error");
          setOpen(true);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    if (!showPanel) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [showPanel]);

  function openResult(result: SearchResult) {
    setOpen(false);
    setQuery("");
    navigate(`/movies/${result.slug}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = results[active] ?? results[0];
    if (result) openResult(result);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showPanel || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    }
  }

  const activeId = results[active] ? `${listId}-${results[active].slug}` : undefined;

  return (
    <form ref={rootRef} className="search" role="search" onSubmit={onSubmit}>
      <SearchIcon />
      <input
        type="search"
        role="combobox"
        placeholder="Search films and live events"
        aria-label="Search films and live events"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={showPanel ? activeId : undefined}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (term) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {showPanel ? (
        <div className="search-panel" id={listId}>
          {!settled && !message ? <p className="search-status">Searching…</p> : null}
          {message ? <p className="search-status">{message}</p> : null}
          {settled && !message && results.length === 0 ? <p className="search-status">No matches.</p> : null}
          {results.length > 0 ? (
            <ul className="search-results" role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <li key={result.slug}>
                  <Link
                    id={`${listId}-${result.slug}`}
                    className={index === active ? "search-result is-active" : "search-result"}
                    role="option"
                    aria-selected={index === active}
                    to={`/movies/${result.slug}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {result.posterUrl ? <img src={result.posterUrl} alt="" /> : <span className="search-poster" aria-hidden="true" />}
                    <span>
                      <strong>{result.title}</strong>
                      <span>
                        {resultLabel(result)} · {result.runtimeMinutes} min
                        {result.fromPrice == null ? "" : ` · ${formatSessionPrice(result.fromPrice)}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
