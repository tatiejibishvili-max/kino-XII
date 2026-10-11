import { useCallback, useEffect, useRef, useState } from "react";
import { useDialog } from "../lib/useDialog";
import EmptySessions from "../components/sessions/EmptySessions";
import MovieSessionGroup from "../components/sessions/MovieSessionGroup";
import SessionsFilters from "../components/sessions/SessionsFilters";
import SessionsLoading, { SessionsError } from "../components/sessions/SessionsLoading";
import SessionsPagination from "../components/sessions/SessionsPagination";
import SessionsToolbar from "../components/sessions/SessionsToolbar";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useSessionCatalog } from "../hooks/useSessionCatalog";
import { useSessionsFilters } from "../hooks/useSessionsFilters";

function useNarrowFilters(onLeaveNarrow: () => void) {
  const onLeaveRef = useRef(onLeaveNarrow);
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 800px)").matches);

  useEffect(() => {
    onLeaveRef.current = onLeaveNarrow;
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const onChange = () => {
      setNarrow(media.matches);
      if (!media.matches) onLeaveRef.current();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return narrow;
}

export default function SessionsPage() {
  const catalogState = useSessionCatalog();
  const query = useSessionsFilters(catalogState.data);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const narrowFilters = useNarrowFilters(closeFilters);
  const filtersRef = useDialog<HTMLElement>(filtersOpen && narrowFilters, closeFilters);
  const filters = query.filters;
  const result = query.result;

  useEffect(() => {
    const previous = document.title;
    document.title = "Sessions · KINO XII";
    return () => {
      document.title = previous;
    };
  }, []);

  function changePage(page: number) {
    query.selectPage(page);
    document.getElementById("sessions-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const canClear = Boolean(filters && (query.activeCount > 0 || filters.page > 1));

  return (
    <div className="page sessions-page">
      <Header variant="solid" />
      <main className="sessions-main">
        <div className="sessions-intro">
          <h1>Sessions</h1>
          <p>Browse showtimes across all venues</p>
        </div>

        {catalogState.status === "error" ? <SessionsError onRetry={catalogState.retry} /> : null}

        {catalogState.status !== "error" && (!catalogState.data || !filters || !result) ? <SessionsLoading /> : null}

        {catalogState.data && filters && result ? (
          <div className="sessions-layout">
            <SessionsFilters
              catalog={catalogState.data}
              filters={filters}
              formatOptions={query.formatOptions}
              activeCount={query.activeCount}
              canClear={canClear}
              open={filtersOpen}
              dialogRef={filtersRef}
              onClose={closeFilters}
              onToggleVenue={query.toggleVenue}
              onToggleFormat={query.toggleFormat}
              onToggleLanguage={query.toggleLanguage}
              onToggleTime={query.toggleTime}
              onSelectDate={query.selectDate}
              onClear={query.clearFilters}
            />
            <section id="sessions-results" className="sessions-results" aria-label="Session results">
              <SessionsToolbar
                totalSessions={result.totalSessions}
                sort={filters.sort}
                activeCount={query.activeCount}
                onSort={query.selectSort}
                onOpenFilters={() => setFiltersOpen(true)}
              />
              {result.groups.length === 0 ? (
                <EmptySessions canClear={canClear} onClear={query.clearFilters} />
              ) : (
                <div className="movie-groups">
                  {result.groups.map((group) => (
                    <MovieSessionGroup key={group.movie.id} group={group} />
                  ))}
                </div>
              )}
              <SessionsPagination page={filters.page} totalPages={result.totalPages} onPage={changePage} />
            </section>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
