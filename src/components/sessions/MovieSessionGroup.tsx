import { Link } from "react-router-dom";
import type { MovieSessionGroup as Group } from "../../types/session";
import AgeBadge from "../AgeBadge";
import Poster from "../Poster";
import SessionItem from "./SessionItem";

interface MovieSessionGroupProps {
  group: Group;
}

function ratingTone(rating: string): "green" | "orange" | "red" {
  if (rating === "G" || rating === "PG" || rating.startsWith("12")) return "green";
  if (rating.startsWith("16")) return "orange";
  return "red";
}

export default function MovieSessionGroup({ group }: MovieSessionGroupProps) {
  return (
    <article className="movie-group">
      <div className="movie-info">
        <Poster title={group.movie.title} theme={group.movie.poster} imageSrc={group.movie.posterUrl ?? undefined} />
        <div>
          <div className="movie-info-title">
            <h3>
              <Link to={`/movies/${group.movie.id}`}>{group.movie.title}</Link>
            </h3>
            <AgeBadge rating={group.movie.ageRating} tone={ratingTone(group.movie.ageRating)} />
          </div>
          <p className="movie-info-duration">{group.movie.duration}</p>
        </div>
      </div>
      <div className="session-list">
        {group.sessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </div>
    </article>
  );
}
