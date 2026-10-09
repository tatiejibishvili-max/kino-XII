import type { UserProfile } from "../types/user";

/**
 * This app has no signed-in account yet. Age checks stay off until a real
 * profile, with a date of birth, is available from authentication.
 */
export function useCurrentUser(): UserProfile | null {
  return null;
}
