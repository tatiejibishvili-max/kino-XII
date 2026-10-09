import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AgeBadge from "../components/AgeBadge";
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
import { loadFilm, loadFilmSessions, type FilmDetail } from "../services/movies";
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
  const [sessionResult, setSessionResult] = useState<{ key: string; halls: HallSessionGroup[] } | null>(null);
  const [sessionFailure, setSessionFailure] = useState<string | null>(null);
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
  const halls = sessionResult?.key === sessionKey ? sessionResult.halls : [];
  const sessionsStatus: "loading" | "ready" | "error" = !sessionKey
    ? "ready"
    : sessionFailure === sessionKey
      ? "error"
      : sessionResult?.key === sessionKey
        ? "ready"
        : "loading";

  useEffect(() => {
    if (!film || !selectedDate) return;
    const key = `${film.id}:${selectedDate}`;
    let cancelled = false;
    loadFilmSessions(film.id, selectedDate)
      .then((next) => {
        if (!cancelled) setSessionResult({ key, halls: next });
      })
      .catch(() => {
        if (!cancelled) setSessionFailure(key);
      });
    return () => {
      cancelled = true;
    };
  }, [film, selectedDate]);

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
        {status === "loading" && <p className="results-count">Loading movie…</p>}
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
  restriction,
}: {
  film: FilmDetail;
  dates: string[];
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  halls: HallSessionGroup[];
  sessionsStatus: "loading" | "ready" | "error";
  restriction: string | null;
}) {
  const venues = groupByVenue(halls);
  const backdrop = film.backdropUrl
    ? [
        "linear-gradient(90deg, rgba(7,12,28,0.92) 0%, rgba(7,12,28,0.62) 48%, rgba(7,12,28,0.35) 100%)",
        "linear-gradient(180deg, rgba(7,12,28,0.08) 20%, rgba(7,12,28,0.72) 100%)",
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
            <h1>{film.title}</h1>
            <p className="movie-description">{film.synopsis}</p>
            <div className="movie-hero-meta">
              <AgeBadge rating={film.ageRating} tone={ratingTone(film.ageRating)} />
              <span className="movie-chip">{film.duration}</span>
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
          {sessionsStatus === "loading" ? <p className="movie-empty">Loading sessions…</p> : null}
          {sessionsStatus === "error" ? <p className="movie-empty">The showtimes could not be loaded.</p> : null}
          {sessionsStatus === "ready" && venues.length === 0 ? <p className="movie-empty">No sessions available for this date.</p> : null}
          {sessionsStatus === "ready" && venues.length > 0 ? (
            <div className="venue-groups">
              {venues.map((venue) => (
                <section key={venue.venueName} className="venue-group">
                  <h3>{venue.venueName}</h3>
                  <div className="venue-halls">
                    {venue.halls.map((hall) => (
                      <div key={hall.hall} className="hall-group">
                        <h4>{hall.hall}</h4>
                        <div className="session-list">
                          {hall.sessions.map((session) => (
                            <SessionItem key={session.id} session={session} unavailable={Boolean(restriction)} />
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

function groupByVenue(halls: HallSessionGroup[]): { venueName: string; halls: HallSessionGroup[] }[] {
  const venues: { venueName: string; halls: HallSessionGroup[] }[] = [];
  for (const hall of halls) {
    const current = venues.find((venue) => venue.venueName === hall.venueName);
    if (current) current.halls.push(hall);
    else venues.push({ venueName: hall.venueName, halls: [hall] });
  }
  return venues;
}
