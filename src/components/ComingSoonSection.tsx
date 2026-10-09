import { comingSoon } from "../data/home";
import ComingSoonCard from "./ComingSoonCard";

export default function ComingSoonSection() {
  return (
    <section className="section coming-soon" aria-labelledby="coming-soon">
      <div className="section-head">
        <h2 id="coming-soon">COMING SOON...</h2>
        <button type="button" className="see-all">
          See all
        </button>
      </div>
      <div className="movie-row">
        {comingSoon.map((movie) => (
          <ComingSoonCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
