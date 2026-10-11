import { Link } from "react-router-dom";
import type { Movie } from "../types/movie";
import EmptyState from "./EmptyState";
import FilmSkeletons from "./FilmSkeletons";
import MovieCard from "./MovieCard";

interface NowPlayingSectionProps {
  movies: Movie[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
}

export default function NowPlayingSection({ movies, status, onRetry }: NowPlayingSectionProps) {
  return (
    <section className="section now-playing" aria-labelledby="now-playing">
      <div className="section-head">
        <h2 id="now-playing">NOW PLAYING</h2>
        <Link className="see-all" to="/sessions">
          See all
        </Link>
      </div>
      {status === "loading" ? <FilmSkeletons label="Loading films" /> : null}
      {status === "error" ? (
        <EmptyState
          title="Films could not be loaded"
          message="The now playing list did not load."
          action={
            <button type="button" className="clear-filters" onClick={onRetry}>
              Retry
            </button>
          }
        />
      ) : null}
      {status === "ready" && movies.length === 0 ? (
        <EmptyState
          title="No movies are playing right now."
          message="Check sessions for the next available screening."
          action={
            <Link className="clear-filters" to="/sessions">
              Browse sessions
            </Link>
          }
        />
      ) : null}
      {status === "ready" && movies.length > 0 ? (
        <div className="movie-row">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
