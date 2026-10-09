import { useAuth } from "../auth/useAuth";
import type { UserProfile } from "../types/user";

/**
 * Age checks use a date of birth only after the account service returns one.
 * A missing date leaves the visitor unrestricted, matching a signed-out visit.
 */
export function useCurrentUser(): UserProfile | null {
  const { account } = useAuth();
  if (!account?.dateOfBirth) return null;
  return { dateOfBirth: account.dateOfBirth };
}
