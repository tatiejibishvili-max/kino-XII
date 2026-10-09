import { Link } from "react-router-dom";
import { nowPlaying } from "../data/home";
import MovieCard from "./MovieCard";

export default function NowPlayingSection() {
  return (
    <section className="section now-playing" aria-labelledby="now-playing">
      <div className="section-head">
        <h2 id="now-playing">NOW PLAYING</h2>
        <Link className="see-all" to="/sessions">
          See all
        </Link>
      </div>
      <div className="movie-row">
        {nowPlaying.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
