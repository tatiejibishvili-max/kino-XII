export interface PosterTheme {
  from: string;
  to: string;
  accent: string;
  spotlightX: number;
}

export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  ageRating: string;
  priceLabel?: string;
  releaseLabel?: string;
  poster: PosterTheme;
  imageSrc?: string;
}

export interface HeroSlide {
  id: string;
  premiereLabel: string;
  title: string;
  ageRating: string;
  duration: string;
  tags: string[];
  description: string;
  poster: PosterTheme;
}
