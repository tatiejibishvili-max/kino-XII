import { formatISODate, parseISODate, startOfDay } from "./sessions/dates";

/** Age in full years. The birthday counts on the calendar day it falls, not from the birth year alone. */
export function calculateAge(birthISO: string, todayISO: string): number {
  const birth = parseISODate(birthISO);
  const today = parseISODate(todayISO);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(today.getTime())) return Number.NaN;

  let age = today.getFullYear() - birth.getFullYear();
  const birthdayStillAhead =
    today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (birthdayStillAhead) age -= 1;
  return age;
}

export function ratingExplanation(ageRating: string): string {
  if (ageRating === "G") return "Suitable for all ages.";
  if (ageRating === "PG") return "Parental guidance suggested.";
  const match = ageRating.match(/(\d+)/);
  if (!match) return "";
  return `Suitable for ages ${match[1]} and over.`;
}

function restrictedAge(ageRating: string): 16 | 18 | null {
  if (ageRating.startsWith("18")) return 18;
  if (ageRating.startsWith("16")) return 16;
  return null;
}

/**
 * Returns the block message for an authenticated viewer who is under the film's age rating.
 * A missing birth date means the viewer is not authenticated, so the sessions stay available.
 */
export function purchaseRestriction(ageRating: string, dateOfBirth: string | null, today = new Date()): string | null {
  if (!dateOfBirth) return null;

  const required = restrictedAge(ageRating);
  if (required == null) return null;

  const age = calculateAge(dateOfBirth, formatISODate(startOfDay(today)));
  if (!Number.isFinite(age) || age >= required) return null;

  return `This film is rated ${required}+. You cannot buy tickets for it with this account.`;
}
