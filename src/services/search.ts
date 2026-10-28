import type { ApiFilm, SearchResult } from "../types/movie";
import { apiRequest } from "./api";

export async function searchTitles(query: string): Promise<SearchResult[]> {
  const body = await apiRequest<{ data: ApiFilm[] }>(`/search?q=${encodeURIComponent(query)}`, { auth: false });
  return body.data.map((film) => ({
    slug: film.slug,
    title: film.title,
    kind: film.kind === "event" ? "event" : "film",
    runtimeMinutes: film.runtimeMinutes,
    posterUrl: film.posterUrl,
    isComingSoon: Boolean(film.isComingSoon),
    fromPrice: film.fromPrice,
    ageRating: film.ageRating.code,
    genre: film.genres?.[0]?.name ?? (film.kind === "event" ? "Live event" : "Film"),
  }));
}
