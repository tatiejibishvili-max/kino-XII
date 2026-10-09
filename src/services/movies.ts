import { parseISODate } from "../lib/sessions/dates";
import { formatSessionPrice } from "../lib/sessions/query";
import type { HallSessionGroup, SessionView } from "../types/session";
import type { Movie, PosterTheme } from "../types/movie";
import { apiRequest } from "./api";

const FALLBACK_POSTER: PosterTheme = { from: "#1a3d66", to: "#070c1c", accent: "#d7e4f2", spotlightX: 62 };

interface ApiFilm {
  slug: string;
  title: string;
  runtimeMinutes: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  fromPrice: number | null;
  synopsis?: string;
  director?: string | null;
  cast?: string | null;
  availableDates?: string[];
  ageRating: { code: string; description?: string };
  genres?: { name: string }[];
  formats?: { name: string }[];
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
}

export interface HomeCatalogue {
  featured: FeaturedFilm[];
  nowPlaying: Movie[];
  comingSoon: Movie[];
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

interface MovieSessionGroupResponse {
  venue: { name: string };
  sessions: {
    id: number;
    time: string;
    price: number;
    seatsLeft: number;
    isSoldOut: boolean;
    hall: { name: string };
    venue: { name: string };
    format: { name: string };
    language: { name: string };
  }[];
}

function releaseLabel(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toMovie(film: ApiFilm, release?: string): Movie {
  return {
    id: film.slug,
    title: film.title,
    genre: film.genres?.[0]?.name ?? "Film",
    duration: `${film.runtimeMinutes} min`,
    ageRating: film.ageRating.code,
    priceLabel: film.fromPrice == null ? "" : formatSessionPrice(film.fromPrice),
    releaseLabel: release,
    poster: FALLBACK_POSTER,
    imageSrc: film.posterUrl ?? undefined,
  };
}

function toFeatured(film: ApiFilm): FeaturedFilm {
  return {
    id: film.slug,
    title: film.title,
    premiereLabel: `PREMIERE · ${releaseLabel(film.releaseDate)}`,
    ageRating: film.ageRating.code,
    duration: `${film.runtimeMinutes} min`,
    tags: (film.formats ?? []).map((format) => format.name),
    description: film.synopsis ?? "",
    backdropUrl: film.backdropUrl,
  };
}

function toDetail(film: ApiFilm): FilmDetail {
  return {
    id: film.slug,
    title: film.title,
    synopsis: film.synopsis ?? "",
    ageRating: film.ageRating.code,
    ratingNote: film.ageRating.description ?? "",
    duration: `${film.runtimeMinutes} min`,
    posterUrl: film.posterUrl,
    backdropUrl: film.backdropUrl,
    poster: FALLBACK_POSTER,
    director: film.director ?? "—",
    cast: film.cast ?? "—",
    releaseDate: releaseLabel(film.releaseDate),
    formats: (film.formats ?? []).map((format) => format.name),
    fromPrice: film.fromPrice,
    availableDates: film.availableDates ?? [],
  };
}

async function filmList(path: string) {
  const body = await apiRequest<{ data: ApiFilm[] }>(path, { auth: false });
  return body.data;
}

export async function loadHomeCatalogue(): Promise<HomeCatalogue> {
  const [featured, nowPlaying, comingSoon] = await Promise.all([
    filmList("/movies/featured"),
    filmList("/movies/now-playing"),
    filmList("/movies/coming-soon"),
  ]);
  return {
    featured: featured.map(toFeatured),
    nowPlaying: nowPlaying.map((film) => toMovie(film)),
    comingSoon: comingSoon.map((film) => toMovie(film, releaseLabel(film.releaseDate))),
  };
}

export async function loadFilm(slug: string): Promise<FilmDetail> {
  const body = await apiRequest<{ data: ApiFilm }>(`/movies/${slug}`, { auth: false });
  return toDetail(body.data);
}

export async function loadFilmSessions(slug: string, date: string): Promise<HallSessionGroup[]> {
  const body = await apiRequest<{ data: MovieSessionGroupResponse[] }>(`/movies/${slug}/sessions?date=${date}`, { auth: false });
  const groups: HallSessionGroup[] = [];

  for (const venueGroup of body.data) {
    const byHall = new Map<string, SessionView[]>();
    for (const session of venueGroup.sessions) {
      const view: SessionView = {
        id: String(session.id),
        movieId: slug,
        startTime: session.time,
        formatLabel: session.format.name,
        languageLabel: session.language.name,
        venueName: session.venue.name,
        hall: session.hall.name,
        price: session.price,
        priceLabel: formatSessionPrice(session.price),
        seatsRemaining: session.seatsLeft,
        soldOut: session.isSoldOut || session.seatsLeft <= 0,
        lowAvailability: session.seatsLeft > 0 && session.seatsLeft <= 8,
      };
      const list = byHall.get(session.hall.name) ?? [];
      list.push(view);
      byHall.set(session.hall.name, list);
    }
    for (const [hall, sessions] of byHall) {
      sessions.sort((left, right) => left.startTime.localeCompare(right.startTime));
      groups.push({ venueName: venueGroup.venue.name, hall, sessions });
    }
  }

  return groups.sort((left, right) => left.venueName.localeCompare(right.venueName) || left.hall.localeCompare(right.hall));
}
