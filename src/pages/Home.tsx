import ComingSoonCard from "../components/ComingSoonCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import MovieCard from "../components/MovieCard";
import MovieRow from "../components/MovieRow";
import { comingSoon, nowPlaying } from "../data/home";

export default function Home() {
  return (
    <div className="page">
      <Header />
      <main>
        <Hero />
        <MovieRow title="NOW PLAYING" id="now-playing">
          {nowPlaying.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </MovieRow>
        <MovieRow title="COMING SOON..." id="coming-soon">
          {comingSoon.map((movie) => (
            <ComingSoonCard key={movie.id} movie={movie} />
          ))}
        </MovieRow>
      </main>
      <Footer />
    </div>
  );
}
