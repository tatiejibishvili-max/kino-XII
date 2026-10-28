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

export interface FeaturedFilm {
  id: string;
  title: string;
  premiereLabel: string;
  ageRating: string;
  duration: string;
  tags: string[];
  description: string;
  backdropUrl: string | null;
}

export interface FilmDetail {
  id: string;
  title: string;
  synopsis: string;
  ageRating: string;
  ratingNote: string;
  duration: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  poster: PosterTheme;
  director: string;
  cast: string;
  releaseDate: string;
  formats: string[];
  fromPrice: number | null;
  availableDates: string[];
  isComingSoon: boolean;
}

export interface HomeCatalogue {
  featured: FeaturedFilm[];
  nowPlaying: Movie[];
  comingSoon: Movie[];
}

export interface ApiFilm {
  slug: string;
  title: string;
  runtimeMinutes: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  fromPrice: number | null;
  synopsis?: string;
  isComingSoon?: boolean;
  director?: string | null;
  cast?: string | null;
  availableDates?: string[];
  ageRating: { code: string; description?: string };
  genres?: { name: string }[];
  formats?: { name: string }[];
  kind?: "film" | "event";
}

export interface SearchResult {
  slug: string;
  title: string;
  kind: "film" | "event";
  runtimeMinutes: number;
  posterUrl: string | null;
  isComingSoon: boolean;
  fromPrice: number | null;
  ageRating: string;
  genre: string;
}

export interface ApiMovieSessionGroup {
  venue: { name: string };
  sessions: {
    id: number;
    startsAt?: string;
    time: string;
    price: number;
    seatsLeft: number;
    isSoldOut: boolean;
    hall: { name: string };
    venue: { name: string };
    format: { name: string };
    language: { name: string; code?: string };
  }[];
}
