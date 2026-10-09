import type { PosterTheme } from "./movie";

export type FormatId = "standard" | "max" | "atmos" | "panorama" | "motion";
export type LanguageId = "ka_dubbed" | "ka_sub" | "original_sub" | "ru_dubbed";
export type TimeOfDayId = "morning" | "afternoon" | "evening";
export type SortId = "showtime_asc" | "showtime_desc" | "price_asc" | "price_desc" | "title_asc";

export interface Venue {
  id: string;
  name: string;
  city: string;
  formats: FormatId[];
}

export interface SessionMovie {
  id: string;
  title: string;
  ageRating: string;
  duration: string;
  poster: PosterTheme;
}

export interface Session {
  id: string;
  movieId: string;
  venueId: string;
  hall: string;
  date: string;
  startTime: string;
  format: FormatId;
  language: LanguageId;
  price: number;
  seatsRemaining: number;
}

export interface SessionCatalog {
  venues: Venue[];
  movies: SessionMovie[];
  sessions: Session[];
  dates: string[];
  today: string;
}

export interface SessionsFilters {
  venues: string[];
  date: string;
  formats: FormatId[];
  languages: LanguageId[];
  times: TimeOfDayId[];
  sort: SortId;
  page: number;
}

export interface SessionView {
  id: string;
  movieId: string;
  startTime: string;
  formatLabel: string;
  languageLabel: string;
  venueName: string;
  hall: string;
  price: number;
  priceLabel: string;
  seatsRemaining: number;
  soldOut: boolean;
  lowAvailability: boolean;
}

export interface MovieSessionGroup {
  movie: SessionMovie;
  sessions: SessionView[];
}

export interface HallSessionGroup {
  venueName: string;
  hall: string;
  sessions: SessionView[];
}
