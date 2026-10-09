import { Link } from "react-router-dom";
import type { Movie } from "../types/movie";
import MovieCard from "./MovieCard";

interface NowPlayingSectionProps {
  movies: Movie[];
  status: "loading" | "ready" | "error";
}

export default function NowPlayingSection({ movies, status }: NowPlayingSectionProps) {
  return (
    <section className="section now-playing" aria-labelledby="now-playing">
      <div className="section-head">
        <h2 id="now-playing">NOW PLAYING</h2>
        <Link className="see-all" to="/sessions">
          See all
        </Link>
      </div>
      {status === "loading" ? <p className="movie-meta">Loading films…</p> : null}
      <div className="movie-row">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
