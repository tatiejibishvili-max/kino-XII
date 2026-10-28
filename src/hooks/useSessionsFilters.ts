import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  activeFilterCount,
  availableFormats,
  interpretSessionsQuery,
  sanitizeFilters,
  serializeFilters,
  toggleValue,
} from "../lib/sessions/query";
import { FORMATS, TIMES, VENUES } from "../data/sessionOptions";
import type { FormatId, LanguageId, SessionCatalog, SessionsFilters, SessionsQueryResult, SortId, TimeOfDayId } from "../types/session";

const VENUE_ORDER = VENUES.map((venue) => venue.id);
const FORMAT_ORDER = FORMATS.map((format) => format.id);
const TIME_ORDER = TIMES.map((time) => time.id);

export function useSessionsFilters(catalog: SessionCatalog | null) {
  const [searchParams, setSearchParams] = useSearchParams();

  const result = useMemo<SessionsQueryResult | null>(() => {
    if (!catalog) return null;
    return interpretSessionsQuery(searchParams, catalog);
  }, [catalog, searchParams]);

  const correction = result?.replaceWith ?? null;

  useEffect(() => {
    if (!catalog || !correction) return;
    setSearchParams(new URLSearchParams(correction), { replace: true });
  }, [catalog, correction, setSearchParams]);

  function commit(next: SessionsFilters, resetPage = true) {
    if (!catalog) return;

    const sanitized = sanitizeFilters(resetPage ? { ...next, page: 1 } : next, catalog);
    const params = serializeFilters(sanitized);
    if (params.toString() === searchParams.toString()) return;
    setSearchParams(params);
  }

  const filters = result?.filters ?? null;

  return {
    result,
    filters,
    activeCount: filters ? activeFilterCount(filters) : 0,
    formatOptions: catalog && filters ? availableFormats(catalog.venues, filters.venues) : [],
    toggleVenue(id: string) {
      if (!filters) return;
      commit({ ...filters, venues: toggleValue(filters.venues, id, VENUE_ORDER) });
    },
    toggleFormat(id: FormatId) {
      if (!filters) return;
      commit({ ...filters, formats: toggleValue(filters.formats, id, FORMAT_ORDER) });
    },
    toggleLanguage(id: LanguageId) {
      if (!filters || !catalog) return;
      const order = catalog.languageChoices.map((language) => language.id);
      commit({ ...filters, languages: toggleValue(filters.languages, id, order) });
    },
    toggleTime(id: TimeOfDayId) {
      if (!filters) return;
      commit({ ...filters, times: toggleValue(filters.times, id, TIME_ORDER) });
    },
    selectDate(date: string) {
      if (!filters || filters.date === date) return;
      commit({ ...filters, date });
    },
    selectSort(sort: SortId) {
      if (!filters || filters.sort === sort) return;
      commit({ ...filters, sort });
    },
    selectPage(page: number) {
      if (!filters || filters.page === page) return;
      commit({ ...filters, page }, false);
    },
    clearFilters() {
      if (!filters) return;
      commit({
        ...filters,
        venues: [],
        formats: [],
        languages: [],
        times: [],
      });
    },
  };
}
