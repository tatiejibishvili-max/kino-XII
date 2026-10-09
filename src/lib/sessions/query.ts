import { DEFAULT_SORT, FORMATS, LANGUAGES, PAGE_SIZE, SORTS, TIMES, VENUES } from "../../data/sessionOptions";
import type {
  FormatId,
  MovieSessionGroup,
  Session,
  SessionCatalog,
  SessionsFilters,
  SessionView,
  SortId,
  TimeOfDayId,
  Venue,
} from "../../types/session";

const FORMAT_IDS = FORMATS.map((item) => item.id);
const LANGUAGE_IDS = LANGUAGES.map((item) => item.id);
const TIME_IDS = TIMES.map((item) => item.id);
const SORT_IDS = SORTS.map((item) => item.id);
const VENUE_IDS = VENUES.map((item) => item.id);

export interface SessionsQueryResult {
  filters: SessionsFilters;
  groups: MovieSessionGroup[];
  totalSessions: number;
  totalPages: number;
  replaceWith: string | null;
}

export function timeOfDay(startTime: string): TimeOfDayId {
  const [hourText, minuteText] = startTime.split(":");
  const minutes = Number(hourText) * 60 + Number(minuteText);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 18 * 60) return "afternoon";
  return "evening";
}

export function availableFormats(venues: Venue[], selectedVenueIds: string[]): FormatId[] {
  if (selectedVenueIds.length === 0) return FORMAT_IDS;

  const supported = new Set<FormatId>();
  for (const venueId of selectedVenueIds) {
    venues.find((venue) => venue.id === venueId)?.formats.forEach((format) => supported.add(format));
  }

  return FORMAT_IDS.filter((format) => supported.has(format));
}

export function activeFilterCount(filters: SessionsFilters): number {
  return filters.venues.length + filters.formats.length + filters.languages.length + filters.times.length;
}

export function formatSessionPrice(price: number): string {
  return `from ₾${price}`;
}

export function toggleValue<T extends string>(current: T[], value: T, order: readonly T[]): T[] {
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return order.filter((item) => next.includes(item));
}

function uniqueValid<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return allowed.filter((item) => values.includes(item));
}

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeFilters(filters: SessionsFilters, catalog: SessionCatalog): SessionsFilters {
  const allowed = new Set(availableFormats(catalog.venues, filters.venues));
  return {
    ...filters,
    formats: filters.formats.filter((format) => allowed.has(format)),
  };
}

export function serializeFilters(filters: SessionsFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.venues.length > 0) params.set("venue", filters.venues.join(","));
  params.set("date", filters.date);
  if (filters.formats.length > 0) params.set("format", filters.formats.join(","));
  if (filters.languages.length > 0) params.set("language", filters.languages.join(","));
  if (filters.times.length > 0) params.set("time", filters.times.join(","));
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

function parseFilters(params: URLSearchParams, catalog: SessionCatalog): SessionsFilters {
  const dateValue = params.get("date");
  const sortValue = params.get("sort");
  const pageValue = params.get("page");
  const pageNumber = pageValue && /^\d+$/.test(pageValue) ? Number(pageValue) : 1;

  return sanitizeFilters(
    {
      venues: uniqueValid(readList(params, "venue"), VENUE_IDS),
      date: dateValue && catalog.dates.includes(dateValue) ? dateValue : catalog.today,
      formats: uniqueValid(readList(params, "format"), FORMAT_IDS),
      languages: uniqueValid(readList(params, "language"), LANGUAGE_IDS),
      times: uniqueValid(readList(params, "time"), TIME_IDS),
      sort: sortValue && SORT_IDS.includes(sortValue as SortId) ? (sortValue as SortId) : DEFAULT_SORT,
      page: pageNumber < 1 ? 1 : pageNumber,
    },
    catalog,
  );
}

export function filterSessions(sessions: Session[], filters: SessionsFilters): Session[] {
  return sessions.filter((session) => {
    if (session.date !== filters.date) return false;
    if (filters.venues.length > 0 && !filters.venues.includes(session.venueId)) return false;
    if (filters.formats.length > 0 && !filters.formats.includes(session.format)) return false;
    if (filters.languages.length > 0 && !filters.languages.includes(session.language)) return false;
    if (filters.times.length > 0 && !filters.times.includes(timeOfDay(session.startTime))) return false;
    return true;
  });
}

function compareSessions(left: Session, right: Session, sort: SortId): number {
  if (sort === "price_asc" || sort === "price_desc") {
    const priceOrder = sort === "price_asc" ? left.price - right.price : right.price - left.price;
    return priceOrder || left.startTime.localeCompare(right.startTime) || left.id.localeCompare(right.id);
  }

  if (sort === "showtime_desc") {
    return right.startTime.localeCompare(left.startTime) || left.id.localeCompare(right.id);
  }

  return left.startTime.localeCompare(right.startTime) || left.id.localeCompare(right.id);
}

export function toSessionView(session: Session, catalog: SessionCatalog): SessionView {
  const venue = catalog.venues.find((item) => item.id === session.venueId);
  const format = FORMATS.find((item) => item.id === session.format);
  const language = LANGUAGES.find((item) => item.id === session.language);

  return {
    id: session.id,
    movieId: session.movieId,
    startTime: session.startTime,
    formatLabel: format?.label ?? session.format,
    languageLabel: language?.label ?? session.language,
    venueName: venue?.name ?? session.venueId,
    hall: session.hall,
    price: session.price,
    priceLabel: formatSessionPrice(session.price),
    seatsRemaining: session.seatsRemaining,
    soldOut: session.seatsRemaining <= 0,
    lowAvailability: session.seatsRemaining > 0 && session.seatsRemaining <= 8,
  };
}

function groupRank(group: MovieSessionGroup, sort: SortId): string | number {
  if (sort === "title_asc") return group.movie.title;

  const prices = group.sessions.map((session) => session.price);
  if (sort === "price_asc") return Math.min(...prices);
  if (sort === "price_desc") return Math.max(...prices);

  return group.sessions[0]?.startTime ?? "";
}

export function groupSessions(sessions: Session[], catalog: SessionCatalog, sort: SortId): MovieSessionGroup[] {
  const byMovie = new Map<string, Session[]>();

  for (const session of sessions) {
    const list = byMovie.get(session.movieId) ?? [];
    list.push(session);
    byMovie.set(session.movieId, list);
  }

  const groups: MovieSessionGroup[] = [];

  for (const [movieId, movieSessions] of byMovie) {
    const movie = catalog.movies.find((item) => item.id === movieId);
    if (!movie) continue;

    const ordered = [...movieSessions].sort((left, right) =>
      compareSessions(left, right, sort === "title_asc" ? "showtime_asc" : sort),
    );

    groups.push({
      movie,
      sessions: ordered.map((session) => toSessionView(session, catalog)),
    });
  }

  groups.sort((left, right) => {
    const direction = sort === "price_desc" || sort === "showtime_desc" ? -1 : 1;
    const leftRank = groupRank(left, sort);
    const rightRank = groupRank(right, sort);
    const rankOrder =
      typeof leftRank === "number" && typeof rightRank === "number"
        ? leftRank - rightRank
        : String(leftRank).localeCompare(String(rightRank));

    return rankOrder * direction || left.movie.title.localeCompare(right.movie.title);
  });

  return groups;
}

export function interpretSessionsQuery(params: URLSearchParams, catalog: SessionCatalog): SessionsQueryResult {
  const parsed = parseFilters(params, catalog);
  const matching = filterSessions(catalog.sessions, parsed);
  const allGroups = groupSessions(matching, catalog, parsed.sort);
  const totalPages = allGroups.length === 0 ? 0 : Math.ceil(allGroups.length / PAGE_SIZE);
  const page = totalPages === 0 ? 1 : Math.min(parsed.page, totalPages);
  const filters = { ...parsed, page };
  const canonical = serializeFilters(filters);

  return {
    filters,
    groups: allGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    totalSessions: matching.length,
    totalPages,
    replaceWith: sameParams(params, canonical) ? null : canonical.toString(),
  };
}

function sameParams(current: URLSearchParams, canonical: URLSearchParams): boolean {
  const keys = ["venue", "date", "format", "language", "time", "sort", "page"];
  const currentKeys = [...current.keys()];
  if (currentKeys.some((key) => !keys.includes(key))) return false;
  return keys.every((key) => (current.get(key) ?? "") === (canonical.get(key) ?? ""));
}
