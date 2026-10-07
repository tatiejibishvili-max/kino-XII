import type { Movie } from "../types/movie";
import AgeBadge from "./AgeBadge";
import Button from "./Button";
import Poster from "./Poster";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="movie-card">
      <Poster title={movie.title} theme={movie.poster} imageSrc={movie.imageSrc} />
      <div className="movie-card-body">
        <h3>{movie.title}</h3>
        <p className="movie-meta">
          {movie.genre} · {movie.duration}
        </p>
        <AgeBadge rating={movie.ageRating} />
        <div className="movie-card-footer">
          <p className="price">{movie.priceLabel}</p>
          <Button size="sm">Buy Ticket</Button>
        </div>
      </div>
    </article>
  );
}
