import ComingSoonSection from "../components/ComingSoonSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import NowPlayingSection from "../components/NowPlayingSection";

export default function Home() {
  return (
    <div className="page">
      <Header />
      <main>
        <HeroSection />
        <NowPlayingSection />
        <ComingSoonSection />
      </main>
      <Footer />
    </div>
  );
}
