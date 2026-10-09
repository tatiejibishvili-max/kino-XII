import type { Movie } from "../types/movie";
import AgeBadge from "./AgeBadge";
import Button from "./Button";
import { BellIcon } from "./Icons";
import Poster from "./Poster";

interface ComingSoonCardProps {
  movie: Movie;
}

export default function ComingSoonCard({ movie }: ComingSoonCardProps) {
  return (
    <article className="soon-card">
      <Poster title={movie.title} theme={movie.poster} imageSrc={movie.imageSrc} orientation="landscape" />
      <div className="soon-card-body">
        <p className="release">{movie.releaseLabel}</p>
        <h3>{movie.title}</h3>
        <p className="movie-meta">
          {movie.genre} · {movie.duration}
        </p>
        <AgeBadge rating={movie.ageRating} tone="green" />
        <Button variant="outline" size="sm">
          <BellIcon />
          Notify Me
        </Button>
      </div>
    </article>
  );
}
