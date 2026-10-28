import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AgeBadge from "../components/AgeBadge";
import EmptyState from "../components/EmptyState";
import { ClockIcon } from "../components/Icons";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Poster from "../components/Poster";
import DateFilter from "../components/sessions/DateFilter";
import SessionItem from "../components/sessions/SessionItem";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { purchaseRestriction } from "../lib/age";
import { formatISODate, startOfDay } from "../lib/sessions/dates";
import { useStartPurchase } from "../purchase/usePurchase";
import { ApiError } from "../services/api";
import { loadFilm, loadFilmSessions } from "../services/movies";
import type { FilmDetail } from "../types/movie";
import type { HallSessionGroup } from "../types/session";

function ratingTone(rating: string): "green" | "orange" | "red" {
  if (rating === "G" || rating === "PG" || rating.startsWith("12")) return "green";
  if (rating.startsWith("16")) return "orange";
  return "red";
}

export default function MovieDetailsPage() {
  const { movieId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const startPurchase = useStartPurchase();
  const startedPurchase = useRef<string | null>(null);
  const user = useCurrentUser();
  const [loadedFilm, setLoadedFilm] = useState<{ id: string; film: FilmDetail } | null>(null);
  const [filmFailure, setFilmFailure] = useState<{ id: string; attempt: number; kind: "missing" | "error" } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [sessionResult, setSessionResult] = useState<{ key: string; attempt: number; halls: HallSessionGroup[] } | null>(null);
  const [sessionFailure, setSessionFailure] = useState<{ key: string; attempt: number } | null>(null);
  const today = useState(() => formatISODate(startOfDay(new Date())))[0];
  const film = loadedFilm?.id === movieId ? loadedFilm.film : null;
  const status = film ? "ready" : filmFailure?.id === movieId && filmFailure.attempt === attempt ? filmFailure.kind : "loading";

  useEffect(() => {
    const purchaseId = searchParams.get("purchase");
    if (!purchaseId || startedPurchase.current === purchaseId) return;
    startedPurchase.current = purchaseId;
    const next = new URLSearchParams(searchParams);
    next.delete("purchase");
    setSearchParams(next, { replace: true });
    startPurchase(purchaseId);
  }, [searchParams, setSearchParams, startPurchase]);

  useEffect(() => {
    let cancelled = false;
    loadFilm(movieId)
      .then((next) => {
        if (!cancelled) setLoadedFilm({ id: movieId, film: next });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFilmFailure({ id: movieId, attempt, kind: error instanceof ApiError && error.status === 404 ? "missing" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, movieId]);

  const dates = film?.availableDates ?? [];
  const selectedDate = pickedDate && dates.includes(pickedDate) ? pickedDate : dates.includes(today) ? today : (dates[0] ?? "");
  const sessionKey = film && selectedDate ? `${film.id}:${selectedDate}` : "";
  const halls = sessionResult?.key === sessionKey && sessionResult.attempt === sessionAttempt ? sessionResult.halls : [];
  const sessionsStatus: "loading" | "ready" | "error" = !sessionKey
    ? "ready"
    : sessionFailure?.key === sessionKey && sessionFailure.attempt === sessionAttempt
      ? "error"
      : sessionResult?.key === sessionKey && sessionResult.attempt === sessionAttempt
        ? "ready"
        : "loading";

  useEffect(() => {
    if (!film || !selectedDate) return;
    const key = `${film.id}:${selectedDate}`;
    const attempt = sessionAttempt;
    let cancelled = false;
    loadFilmSessions(film.id, selectedDate)
      .then((next) => {
        if (!cancelled) setSessionResult({ key, attempt, halls: next });
      })
      .catch(() => {
        if (!cancelled) setSessionFailure({ key, attempt });
      });
    return () => {
      cancelled = true;
    };
  }, [film, selectedDate, sessionAttempt]);

  useEffect(() => {
    const previous = document.title;
    document.title = film ? `${film.title} · KINO XII` : "Movie · KINO XII";
    return () => {
      document.title = previous;
    };
  }, [film]);

  return (
    <div className="page sessions-page movie-page">
      <Header variant="solid" />
      <main className="sessions-main movie-main">
        {status === "loading" && <MovieLoading />}
        {status === "error" && (
          <div className="empty-sessions">
            <h1>Movie unavailable</h1>
            <p>This film could not be loaded.</p>
            <button type="button" className="clear-filters" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}
        {status === "missing" && (
          <div className="empty-sessions">
            <h1>Movie unavailable</h1>
            <p>This film could not be found.</p>
            <Link className="clear-filters" to="/sessions">
              Browse sessions
            </Link>
          </div>
        )}
        {film && (
          <MovieDetails
            film={film}
            dates={dates}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={setPickedDate}
            halls={halls}
            sessionsStatus={sessionsStatus}
            onRetrySessions={() => setSessionAttempt((value) => value + 1)}
            restriction={purchaseRestriction(film.ageRating, user?.dateOfBirth ?? null)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function MovieDetails({
  film,
  dates,
  today,
  selectedDate,
  onSelectDate,
  halls,
  sessionsStatus,
  onRetrySessions,
  restriction,
}: {
  film: FilmDetail;
  dates: string[];
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  halls: HallSessionGroup[];
  sessionsStatus: "loading" | "ready" | "error";
  onRetrySessions: () => void;
  restriction: string | null;
}) {
  const venues = groupByVenue(halls);
  const backdrop = film.backdropUrl
    ? [
        "linear-gradient(90deg, rgba(7,11,25,0.86) 0%, rgba(7,11,25,0.42) 40%, rgba(7,11,25,0.08) 68%, rgba(7,11,25,0.3) 100%)",
        "linear-gradient(180deg, rgba(7,11,25,0.62) 0%, rgba(7,11,25,0.08) 24%, rgba(7,11,25,0) 46%, rgba(7,11,25,0.28) 76%, #070b19 100%)",
        `url("${film.backdropUrl}")`,
      ].join(", ")
    : undefined;

  return (
    <>
      <section className="movie-hero" aria-label={film.title}>
        <div
          className="movie-hero-backdrop"
          style={{
            backgroundColor: "#070C1C",
            backgroundImage: backdrop,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="movie-hero-inner">
          <Poster title={film.title} theme={film.poster} imageSrc={film.posterUrl ?? undefined} />
          <div className="movie-hero-copy">
            <p className="movie-kicker">{film.isComingSoon ? "Coming soon" : "Now playing"}</p>
            <h1>{film.title}</h1>
            <p className="movie-description">{film.synopsis}</p>
            <div className="movie-hero-meta">
              <AgeBadge rating={film.ageRating} tone={ratingTone(film.ageRating)} />
              <span className="movie-chip movie-chip--time">
                <ClockIcon />
                {film.duration}
              </span>
              {film.formats.map((format) => (
                <span key={format} className="movie-chip">
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="movie-layout">
        <section className="movie-sessions" aria-label="Sessions">
          <h2>Sessions</h2>
          {dates.length > 0 ? <DateFilter dates={dates} today={today} selected={selectedDate} onSelect={onSelectDate} /> : null}
          {restriction && (
            <p className="age-restriction" role="status">
              {restriction}
            </p>
          )}
          {sessionsStatus === "loading" ? <SessionSkeletons /> : null}
          {sessionsStatus === "error" ? (
            <EmptyState
              title="Showtimes could not be loaded"
              message="Something went wrong while loading this date. Your selected date is still here."
              action={
                <button type="button" className="clear-filters" onClick={onRetrySessions}>
                  Retry
                </button>
              }
            />
          ) : null}
          {sessionsStatus === "ready" && venues.length === 0 ? (
            <EmptyState
              title="No sessions available for this date."
              message="Try another date."
              action={
                dates.length > 1 ? (
                  <button
                    type="button"
                    className="clear-filters"
                    onClick={() => {
                      const index = dates.indexOf(selectedDate);
                      const next = dates[(index + 1) % dates.length];
                      if (next) onSelectDate(next);
                    }}
                  >
                    Show another date
                  </button>
                ) : null
              }
            />
          ) : null}
          {sessionsStatus === "ready" && venues.length > 0 ? (
            <div className="venue-groups">
              {venues.map((venue) => (
                <section key={venue.venueName} className="venue-group">
                  <h3>{venue.venueName}</h3>
                  <div className="venue-halls">
                    {venue.halls.map((hall) => (
                      <div key={hall.hall} className="hall-group">
                        <h4>{hallLabel(hall.hall)}</h4>
                        <div className="session-list">
                          {hall.sessions.map((session) => (
                            <SessionItem key={session.id} session={session} layout="movie" unavailable={Boolean(restriction)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="movie-details" aria-label="Details">
          <h2>Details</h2>
          <dl className="movie-details-list">
            <div>
              <dt>Director</dt>
              <dd>{film.director}</dd>
            </div>
            <div>
              <dt>Main cast</dt>
              <dd>{film.cast}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{film.duration}</dd>
            </div>
            <div>
              <dt>Release date</dt>
              <dd>{film.releaseDate}</dd>
            </div>
            <div>
              <dt>Formats</dt>
              <dd>{film.formats.length > 0 ? film.formats.join(", ") : "—"}</dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>{film.fromPrice == null ? "—" : `₾${film.fromPrice}`}</dd>
            </div>
          </dl>
          {film.ratingNote ? (
            <p className="movie-rating-note">
              <strong>Rating note</strong>
              {film.ratingNote}
            </p>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function MovieLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading movie</p>
      <div className="skeleton movie-skel-hero" />
      <div className="movie-layout">
        <SessionSkeletons dates />
        <div className="skeleton movie-skel-details" />
      </div>
    </div>
  );
}

function SessionSkeletons({ dates = false }: { dates?: boolean }) {
  return (
    <div className="venue-groups" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading sessions</p>
      {dates ? (
        <div className="movie-skel-dates" aria-hidden="true">
          <div className="skeleton movie-skel-date" />
          <div className="skeleton movie-skel-date" />
          <div className="skeleton movie-skel-date" />
          <div className="skeleton movie-skel-date" />
        </div>
      ) : null}
      <section className="venue-group">
        <div className="skeleton movie-skel-venue" />
        <div className="venue-halls">
          <div className="hall-group">
            <div className="skeleton movie-skel-title" />
            <div className="session-list">
              <div className="skeleton movie-skel-ticket" />
              <div className="skeleton movie-skel-ticket" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function hallLabel(name: string) {
  return /^hall\b/i.test(name) ? name : `Hall ${name}`;
}

function groupByVenue(halls: HallSessionGroup[]): { venueName: string; halls: HallSessionGroup[] }[] {
  const venues: { venueName: string; halls: HallSessionGroup[] }[] = [];
  for (const hall of halls) {
    const current = venues.find((venue) => venue.venueName === hall.venueName);
    if (current) current.halls.push(hall);
    else venues.push({ venueName: hall.venueName, halls: [hall] });
  }
  return venues;
}
