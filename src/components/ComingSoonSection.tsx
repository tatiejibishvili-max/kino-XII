import type { Movie } from "../types/movie";
import ComingSoonCard from "./ComingSoonCard";
import EmptyState from "./EmptyState";
import FilmSkeletons from "./FilmSkeletons";

interface ComingSoonSectionProps {
  movies: Movie[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
}

export default function ComingSoonSection({ movies, status, onRetry }: ComingSoonSectionProps) {
  return (
    <section className="section coming-soon" aria-labelledby="coming-soon">
      <div className="section-head">
        <h2 id="coming-soon">COMING SOON...</h2>
      </div>
      {status === "loading" ? <FilmSkeletons label="Loading upcoming films" wide /> : null}
      {status === "error" ? (
        <EmptyState
          title="Upcoming films could not be loaded"
          message="This list did not load."
          action={
            <button type="button" className="clear-filters" onClick={onRetry}>
              Retry
            </button>
          }
        />
      ) : null}
      {status === "ready" && movies.length === 0 ? (
        <EmptyState title="No upcoming releases right now." message="New films will appear here when the cinema announces them." />
      ) : null}
      {status === "ready" && movies.length > 0 ? (
        <div className="movie-row">
          {movies.map((movie) => (
            <ComingSoonCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
