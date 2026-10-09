import type { FormatId, LanguageId, SortId, TimeOfDayId, Venue } from "../types/session";

export const PAGE_SIZE = 10;

export const VENUES: Venue[] = [
  { id: "galleria", name: "Galleria Tbilisi", city: "Tbilisi", formats: ["standard", "max", "atmos", "panorama"] },
  { id: "rustaveli", name: "Rustaveli Palace", city: "Tbilisi", formats: ["standard", "max", "panorama"] },
  { id: "vake", name: "Vake Park", city: "Tbilisi", formats: ["standard", "atmos"] },
  { id: "batumi", name: "Batumi Boulevard", city: "Batumi", formats: ["standard", "max", "motion", "panorama"] },
];

export const FORMATS: { id: FormatId; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "max", label: "MAX" },
  { id: "atmos", label: "ATMOS" },
  { id: "panorama", label: "PANORAMA" },
  { id: "motion", label: "MOTION" },
];

export const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: "ka_dubbed", label: "ქართული დუბლიაჟი" },
  { id: "ka_sub", label: "ქართული სუბტიტრები" },
  { id: "original_sub", label: "ორიგინალი სუბტიტრებით" },
  { id: "ru_dubbed", label: "რუსული დუბლიაჟი" },
];

export const TIMES: { id: TimeOfDayId; label: string; hint: string }[] = [
  { id: "morning", label: "დილა", hint: "before 12:00" },
  { id: "afternoon", label: "დღე", hint: "12:00–18:00" },
  { id: "evening", label: "საღამო", hint: "after 18:00" },
];

export const SORTS: { id: SortId; label: string }[] = [
  { id: "showtime_asc", label: "Showtime: Earliest First" },
  { id: "showtime_desc", label: "Showtime: Latest First" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "title_asc", label: "Title: A–Z" },
];

export const DEFAULT_SORT: SortId = "showtime_asc";
