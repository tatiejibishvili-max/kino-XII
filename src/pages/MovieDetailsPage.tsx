import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AgeBadge from "../components/AgeBadge";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Poster from "../components/Poster";
import DateFilter from "../components/sessions/DateFilter";
import SessionItem from "../components/sessions/SessionItem";
import { movieProfile } from "../data/movieDetails";
import { FORMATS } from "../data/sessionOptions";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useSessionCatalog } from "../hooks/useSessionCatalog";
import { purchaseRestriction, ratingExplanation } from "../lib/age";
import { groupByHall } from "../lib/sessions/halls";
import type { FormatId, HallSessionGroup, Session, SessionMovie } from "../types/session";

function ratingTone(rating: string): "green" | "orange" | "red" {
  if (rating === "G" || rating === "PG" || rating.startsWith("12")) return "green";
  if (rating.startsWith("16")) return "orange";
  return "red";
}

export default function MovieDetailsPage() {
  const { movieId = "" } = useParams();
  const catalogState = useSessionCatalog();
  const user = useCurrentUser();
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const catalog = catalogState.data;
  const movie = catalog?.movies.find((item) => item.id === movieId) ?? null;
  const selectedDate = catalog && pickedDate && catalog.dates.includes(pickedDate) ? pickedDate : (catalog?.today ?? "");

  useEffect(() => {
    const previous = document.title;
    document.title = movie ? `${movie.title} · KINO XII` : "Movie · KINO XII";
    return () => {
      document.title = previous;
    };
  }, [movie]);

  return (
    <div className="page sessions-page movie-page">
      <Header variant="solid" />
      <main className="sessions-main movie-main">
        {catalogState.status === "loading" && <p className="results-count">Loading movie…</p>}
        {catalogState.status === "error" && (
          <div className="empty-sessions">
            <h1>Sessions unavailable</h1>
            <p>The showtimes could not be loaded.</p>
            <button type="button" className="clear-filters" onClick={catalogState.retry}>
              Try again
            </button>
          </div>
        )}
        {catalog && !movie && (
          <div className="empty-sessions">
            <h1>Movie unavailable</h1>
            <p>This film could not be found.</p>
            <Link className="clear-filters" to="/sessions">
              Browse sessions
            </Link>
          </div>
        )}
        {catalog && movie && (
          <MovieDetails
            movie={movie}
            dates={catalog.dates}
            today={catalog.today}
            selectedDate={selectedDate}
            onSelectDate={setPickedDate}
            halls={groupByHall(
              catalog.sessions.filter((session) => session.movieId === movie.id && session.date === selectedDate),
              catalog,
            )}
            formats={formatsForMovie(catalog.sessions, movie.id)}
            fromPrice={lowestPrice(catalog.sessions, movie.id)}
            restriction={purchaseRestriction(movie.ageRating, user?.dateOfBirth ?? null)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function formatsForMovie(sessions: { movieId: string; format: FormatId }[], movieId: string): string[] {
  const used = new Set(sessions.filter((session) => session.movieId === movieId).map((session) => session.format));
  return FORMATS.filter((format) => used.has(format.id)).map((format) => format.label);
}

function lowestPrice(sessions: Session[], movieId: string): number | null {
  const prices = sessions.filter((session) => session.movieId === movieId).map((session) => session.price);
  return prices.length > 0 ? Math.min(...prices) : null;
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

function MovieDetails({
  movie,
  dates,
  today,
  selectedDate,
  onSelectDate,
  halls,
  formats,
  fromPrice,
  restriction,
}: {
  movie: SessionMovie;
  dates: string[];
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  halls: ReturnType<typeof groupByHall>;
  formats: string[];
  fromPrice: number | null;
  restriction: string | null;
}) {
  const profile = movieProfile(movie.id);
  const explanation = ratingExplanation(movie.ageRating);
  const venues = groupByVenue(halls);

  return (
    <>
      <section className="movie-hero" aria-label={movie.title}>
        <div
          className="movie-hero-backdrop"
          style={{
            backgroundColor: movie.poster.to,
            backgroundImage: [
              "linear-gradient(90deg, rgba(7,12,28,0.92) 0%, rgba(7,12,28,0.72) 46%, rgba(7,12,28,0.45) 100%)",
              "linear-gradient(180deg, rgba(7,12,28,0.15) 20%, rgba(7,12,28,0.55) 100%)",
              `radial-gradient(circle at ${movie.poster.spotlightX}% 40%, ${movie.poster.accent}99, transparent 42%)`,
              `linear-gradient(145deg, ${movie.poster.from}, ${movie.poster.to})`,
            ].join(", "),
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="movie-hero-inner">
          <Poster title={movie.title} theme={movie.poster} />
          <div className="movie-hero-copy">
            <h1>{movie.title}</h1>
            <p className="movie-description">{profile?.description ?? "Showtimes for this film are listed below."}</p>
            <div className="movie-hero-meta">
              <AgeBadge rating={movie.ageRating} tone={ratingTone(movie.ageRating)} />
              <span className="movie-chip">{movie.duration}</span>
              {formats.map((format) => (
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
          <DateFilter dates={dates} today={today} selected={selectedDate} onSelect={onSelectDate} />
          {restriction && (
            <p className="age-restriction" role="status">
              {restriction}
            </p>
          )}
          {venues.length === 0 ? (
            <p className="movie-empty">No sessions available for this date.</p>
          ) : (
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
          )}
        </section>

        <aside className="movie-details" aria-label="Details">
          <h2>Details</h2>
          <dl className="movie-details-list">
            <div>
              <dt>Director</dt>
              <dd>{profile?.director ?? "—"}</dd>
            </div>
            <div>
              <dt>Main cast</dt>
              <dd>{profile?.cast.join(", ") ?? "—"}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{movie.duration}</dd>
            </div>
            <div>
              <dt>Release date</dt>
              <dd>{profile?.releaseDate ?? "—"}</dd>
            </div>
            <div>
              <dt>Formats</dt>
              <dd>{formats.length > 0 ? formats.join(", ") : "—"}</dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>{fromPrice == null ? "—" : `₾${fromPrice}`}</dd>
            </div>
          </dl>
          {explanation && (
            <p className="movie-rating-note">
              <strong>Rating note</strong>
              {explanation}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
