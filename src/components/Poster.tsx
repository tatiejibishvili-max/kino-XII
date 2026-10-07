import type { PosterTheme } from "../types/movie";

interface PosterProps {
  title: string;
  theme: PosterTheme;
  imageSrc?: string;
  orientation?: "portrait" | "landscape";
}

export default function Poster({ title, theme, imageSrc, orientation = "portrait" }: PosterProps) {
  const className = `poster poster--${orientation}`;
  const label = `${title} poster`;

  if (imageSrc) {
    return <img className={className} src={imageSrc} alt={label} />;
  }

  return (
    <div
      className={`${className} poster-placeholder`}
      role="img"
      aria-label={label}
      style={{
        backgroundColor: theme.to,
        backgroundImage: [
          "linear-gradient(180deg, rgba(7,12,28,0) 38%, rgba(7,12,28,0.82) 100%)",
          `radial-gradient(circle at ${theme.spotlightX}% 30%, ${theme.accent}99, transparent 42%)`,
          `radial-gradient(circle at 80% 88%, ${theme.from}, transparent 46%)`,
          `linear-gradient(165deg, ${theme.from} 0%, ${theme.to} 80%)`,
        ].join(", "),
      }}
    >
      <span className="poster-horizon" aria-hidden="true" />
    </div>
  );
}
