import { useState } from "react";
import { Link } from "react-router-dom";
import type { FeaturedFilm } from "../types/movie";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, TicketIcon } from "./Icons";

interface HeroSectionProps {
  slides: FeaturedFilm[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
}

export default function HeroSection({ slides, status, onRetry }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const slide = slides[index] ?? slides[0];

  function showSlide(nextIndex: number) {
    if (count === 0) return;
    setIndex((nextIndex + count) % count);
  }

  if (status === "loading") {
    return (
      <section className="hero" aria-label="Featured films" aria-busy="true">
        <p className="sr-only">Loading films</p>
        <div className="hero-copy">
          <div className="skeleton home-skel-line" />
          <div className="skeleton home-skel-title" />
          <div className="skeleton home-skel-copy" />
        </div>
      </section>
    );
  }

  if (status === "error" || !slide) {
    return (
      <section className="hero" aria-label="Featured films">
        <p className="hero-description">The featured films could not be loaded.</p>
        <button type="button" className="btn btn--ghost btn--md" onClick={onRetry}>
          Try again
        </button>
      </section>
    );
  }

  const backdrop = slide.backdropUrl
    ? [
        "linear-gradient(90deg, rgba(7,12,28,0.94) 0%, rgba(7,12,28,0.72) 34%, rgba(7,12,28,0.28) 68%, rgba(7,12,28,0.45) 100%)",
        "linear-gradient(180deg, rgba(7,12,28,0.2) 0%, rgba(7,12,28,0.05) 40%, #070C1C 100%)",
        `url("${slide.backdropUrl}")`,
      ].join(", ")
    : undefined;

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured films">
      <div
        key={slide.id}
        className="hero-backdrop"
        style={backdrop ? { backgroundColor: "#070C1C", backgroundImage: backdrop, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />

      <div className="hero-copy">
        <p className="premiere">{slide.premiereLabel}</p>
        <h1 className="hero-title">{slide.title}</h1>
        <ul className="hero-meta">
          <li>{slide.ageRating}</li>
          <li>
            <ClockIcon />
            {slide.duration}
          </li>
          {slide.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <p className="hero-description">{slide.description}</p>
        <div className="hero-actions">
          <Link className="btn btn--primary btn--md" to={`/movies/${slide.id}`}>
            <TicketIcon />
            Buy tickets
          </Link>
          <Link className="btn btn--ghost btn--md" to="/sessions">
            All sessions
          </Link>
        </div>
      </div>

      <div className="hero-controls">
        <div className="hero-progress">
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className="hero-progress-btn"
              aria-label={`Show ${item.title}`}
              aria-current={itemIndex === index ? "true" : undefined}
              onClick={() => showSlide(itemIndex)}
            />
          ))}
        </div>
        <div className="hero-arrows">
          <button type="button" aria-label="Previous film" onClick={() => showSlide(index - 1)}>
            <ChevronLeftIcon />
          </button>
          <button type="button" aria-label="Next film" onClick={() => showSlide(index + 1)}>
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
