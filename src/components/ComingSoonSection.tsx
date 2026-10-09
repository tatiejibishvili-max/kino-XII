import type { Movie } from "../types/movie";
import ComingSoonCard from "./ComingSoonCard";

interface ComingSoonSectionProps {
  movies: Movie[];
  status: "loading" | "ready" | "error";
}

export default function ComingSoonSection({ movies, status }: ComingSoonSectionProps) {
  return (
    <section className="section coming-soon" aria-labelledby="coming-soon">
      <div className="section-head">
        <h2 id="coming-soon">COMING SOON...</h2>
      </div>
      {status === "loading" ? <p className="movie-meta">Loading films…</p> : null}
      <div className="movie-row">
        {movies.map((movie) => (
          <ComingSoonCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
