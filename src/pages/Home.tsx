import ComingSoonSection from "../components/ComingSoonSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import NowPlayingSection from "../components/NowPlayingSection";
import { useHomeCatalogue } from "../hooks/useHomeCatalogue";

export default function Home() {
  const catalogue = useHomeCatalogue();
  const films = catalogue.data;

  return (
    <div className="page">
      <Header />
      <main>
        <HeroSection slides={films?.featured ?? []} status={catalogue.status} onRetry={catalogue.retry} />
        <NowPlayingSection movies={films?.nowPlaying ?? []} status={catalogue.status} onRetry={catalogue.retry} />
        <ComingSoonSection movies={films?.comingSoon ?? []} status={catalogue.status} onRetry={catalogue.retry} />
      </main>
      <Footer />
    </div>
  );
}
