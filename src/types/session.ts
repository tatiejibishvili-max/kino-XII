import type { PosterTheme } from "./movie";

export type FormatId = "standard" | "max" | "atmos" | "panorama" | "motion";
export type LanguageId = string;
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
  posterUrl: string | null;
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
  languageChoices: { id: string; label: string }[];
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
  languageCode?: string;
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

export interface SessionSummary {
  session: Session;
  movie: SessionMovie;
  venueName: string;
  formatLabel: string;
  languageLabel: string;
}

export interface SessionsQueryResult {
  filters: SessionsFilters;
  groups: MovieSessionGroup[];
  totalSessions: number;
  totalPages: number;
  replaceWith: string | null;
}

export interface ApiFormat {
  slug: string;
  name?: string;
}

export interface ApiVenue {
  slug: string;
  name: string;
  city: string;
  formats: ApiFormat[];
}

export interface ApiLanguage {
  slug: string;
  name: string;
}

export interface ApiSessionMovie {
  slug: string;
  title: string;
  runtimeMinutes: number;
  posterUrl?: string | null;
  ageRating: { code: string };
}

export interface ApiCatalogueSession {
  id: number;
  date: string;
  time: string;
  price: number;
  seatsLeft: number;
  hall: { name: string };
  venue: ApiVenue;
  format: ApiFormat;
  language: ApiLanguage;
  movie: ApiSessionMovie;
}

export interface ApiSessionGroup {
  movie: ApiSessionMovie;
  sessions: ApiCatalogueSession[];
}

export interface ApiFilterOptions {
  venues: ApiVenue[];
  languages: ApiLanguage[];
}

export interface ApiSessionDetail {
  id: number;
  date: string;
  time: string;
  price: number;
  seatsLeft: number;
  hall: { name: string };
  venue: { slug: string; name: string };
  format: { slug: string; name: string };
  language: { slug: string; name: string };
  movie: ApiSessionMovie;
}
