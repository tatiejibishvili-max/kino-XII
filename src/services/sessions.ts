import { addDays, formatISODate, startOfDay } from "../lib/sessions/dates";
import { apiRequest } from "./api";
import type { PosterTheme } from "../types/movie";
import type {
  ApiFilterOptions,
  ApiSessionDetail,
  ApiSessionGroup,
  FormatId,
  Session,
  SessionCatalog,
  SessionMovie,
  SessionSummary,
  Venue,
} from "../types/session";

const FORMATS: FormatId[] = ["standard", "max", "atmos", "panorama", "motion"];

const PALETTES: PosterTheme[] = [
  { from: "#1a3d66", to: "#0b1018", accent: "#d7e4f2", spotlightX: 48 },
  { from: "#243656", to: "#100c16", accent: "#f09a8a", spotlightX: 62 },
  { from: "#8d1f24", to: "#16080c", accent: "#ffb4a2", spotlightX: 42 },
  { from: "#c4843c", to: "#1c1008", accent: "#ffe0a8", spotlightX: 55 },
  { from: "#1d4a38", to: "#100810", accent: "#d6c07a", spotlightX: 36 },
  { from: "#5c1e2c", to: "#12080c", accent: "#f2d2c8", spotlightX: 50 },
];

let catalogRequest: Promise<SessionCatalog> | null = null;

function posterFor(slug: string): PosterTheme {
  const index = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % PALETTES.length;
  return PALETTES[index];
}

function asFormat(slug: string): FormatId {
  return FORMATS.includes(slug as FormatId) ? (slug as FormatId) : "standard";
}

async function fetchDate(date: string): Promise<ApiSessionGroup[]> {
  const groups: ApiSessionGroup[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const body = await apiRequest<{ data: ApiSessionGroup[]; meta: { lastPage: number } }>(
      `/sessions?date=${date}&page=${page}`,
      { auth: false },
    );
    groups.push(...body.data);
    lastPage = body.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage && page <= 20);
  return groups;
}

async function fetchCatalog(): Promise<SessionCatalog> {
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 7 }, (_, index) => formatISODate(addDays(today, index)));
  const [rawOptions, ...days] = await Promise.all([
    apiRequest<ApiFilterOptions | { data: ApiFilterOptions }>("/filter-options", { auth: false }),
    ...dates.map((date) => fetchDate(date)),
  ]);
  const options = "venues" in rawOptions ? rawOptions : rawOptions.data;

  const movies = new Map<string, SessionMovie>();
  const sessions: Session[] = [];
  for (const groups of days) {
    for (const group of groups) {
      const movie = group.movie;
      if (!movies.has(movie.slug)) {
        movies.set(movie.slug, {
          id: movie.slug,
          title: movie.title,
          ageRating: movie.ageRating.code,
          duration: `${movie.runtimeMinutes} min`,
          poster: posterFor(movie.slug),
          posterUrl: movie.posterUrl ?? null,
        });
      }
      for (const session of group.sessions) {
        sessions.push({
          id: String(session.id),
          movieId: movie.slug,
          venueId: session.venue.slug,
          hall: session.hall.name,
          date: session.date,
          startTime: session.time,
          format: asFormat(session.format.slug),
          language: session.language.slug,
          price: session.price,
          seatsRemaining: session.seatsLeft,
        });
      }
    }
  }

  const venues: Venue[] = options.venues.map((venue) => ({
    id: venue.slug,
    name: venue.name,
    city: venue.city,
    formats: venue.formats.map((format) => asFormat(format.slug)),
  }));

  return {
    venues,
    movies: [...movies.values()],
    sessions,
    dates,
    today: dates[0],
    languageChoices: options.languages.map((language) => ({ id: language.slug, label: language.name })),
  };
}

export function loadSessionCatalog(): Promise<SessionCatalog> {
  if (!catalogRequest) {
    catalogRequest = fetchCatalog().catch((error: unknown) => {
      catalogRequest = null;
      throw error;
    });
  }
  return catalogRequest;
}

export function resetSessionCatalog() {
  catalogRequest = null;
}

export async function loadSessionSummary(sessionId: string): Promise<SessionSummary> {
  const body = await apiRequest<{ data: ApiSessionDetail }>(`/sessions/${sessionId}`, { auth: false });
  const item = body.data;
  const movie = item.movie;
  return {
    session: {
      id: String(item.id),
      movieId: movie.slug,
      venueId: item.venue.slug,
      hall: item.hall.name,
      date: item.date,
      startTime: item.time,
      format: asFormat(item.format.slug),
      language: item.language.slug,
      price: item.price,
      seatsRemaining: item.seatsLeft,
    },
    movie: {
      id: movie.slug,
      title: movie.title,
      ageRating: movie.ageRating.code,
      duration: `${movie.runtimeMinutes} min`,
      poster: posterFor(movie.slug),
      posterUrl: movie.posterUrl ?? null,
    },
    venueName: item.venue.name,
    formatLabel: item.format.name,
    languageLabel: item.language.name,
  };
}
