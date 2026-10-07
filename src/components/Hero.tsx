import { useState } from "react";
import heroFigure from "../assets/hero-figure.svg";
import { heroSlides } from "../data/home";
import Button from "./Button";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, TicketIcon } from "./Icons";

export default function Hero() {
  const [index, setIndex] = useState(0);
  const slide = heroSlides[index];
  const count = heroSlides.length;

  function showSlide(nextIndex: number) {
    setIndex((nextIndex + count) % count);
  }

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured films">
      <div
        key={slide.id}
        className="hero-backdrop"
        style={{
          backgroundColor: "#070C1C",
          backgroundImage: [
            "linear-gradient(90deg, rgba(7,12,28,0.96) 0%, rgba(7,12,28,0.9) 28%, rgba(7,12,28,0.55) 48%, rgba(7,12,28,0.12) 70%, rgba(7,12,28,0.4) 100%)",
            "linear-gradient(180deg, rgba(7,12,28,0.55) 0%, rgba(7,12,28,0.05) 24%, rgba(7,12,28,0.15) 62%, #070C1C 100%)",
            `radial-gradient(ellipse at ${slide.poster.spotlightX}% 40%, ${slide.poster.accent}66, transparent 46%)`,
            `radial-gradient(ellipse at ${slide.poster.spotlightX}% 46%, ${slide.poster.from} 0%, ${slide.poster.to} 68%)`,
          ].join(", "),
        }}
      />
      <img className="hero-figure" src={heroFigure} alt="" />

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
          <Button>
            <TicketIcon />
            Buy tickets
          </Button>
          <Button variant="ghost">All sessions</Button>
        </div>
      </div>

      <div className="hero-controls">
        <div className="hero-progress">
          {heroSlides.map((item, itemIndex) => (
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
