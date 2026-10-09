import { Link } from "react-router-dom";
import type { Movie } from "../types/movie";
import AgeBadge from "./AgeBadge";
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
        <AgeBadge rating={movie.ageRating} tone="red" />
        <div className="movie-card-footer">
          <p className="price">{movie.priceLabel}</p>
          <Link className="btn btn--primary btn--sm" to={`/movies/${movie.id}`}>
            Buy Ticket
          </Link>
        </div>
      </div>
    </article>
  );
}
