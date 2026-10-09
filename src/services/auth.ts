/**
 * Account calls go to the Kino XII API.
 * The bearer token is stored for this browser tab. The password is never stored.
 */
import { ApiError, apiRequest, readToken, writeToken } from "./api";
export class AuthApiError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "AuthApiError";
    this.fieldErrors = fieldErrors;
  }
}

export interface AuthAccount {
  id: string;
  username: string;
  email: string;
  dateOfBirth: string | null;
  profileComplete: boolean | null;
  avatarUrl: string | null;
  fullName: string | null;
  mobileNumber: string | null;
}

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  avatar: File | null;
}

export type RegistrationResult = { status: "authenticated"; account: AuthAccount } | { status: "signed-up" };

const ACCOUNT_KEY = "kino-xii-account";

interface ApiUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  dateOfBirth: string | null;
  profileComplete: boolean;
}

function accountFromUser(user: ApiUser): AuthAccount {
  return {
    id: String(user.id),
    username: user.username,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
    profileComplete: user.profileComplete,
    avatarUrl: user.avatar,
    fullName: user.fullName,
    mobileNumber: user.mobileNumber,
  };
}

function asAuthError(error: unknown): never {
  if (error instanceof ApiError) throw new AuthApiError(error.message, error.fieldErrors);
  throw error;
}

export function readStoredAccount(): AuthAccount | null {
  try {
    const raw = sessionStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const account = parsed as AuthAccount;
    if (typeof account.id !== "string" || typeof account.email !== "string" || typeof account.username !== "string") return null;
    return { ...account, fullName: account.fullName ?? null, mobileNumber: account.mobileNumber ?? null };
  } catch {
    return null;
  }
}

export function storeAccount(account: AuthAccount | null) {
  try {
    if (!account) sessionStorage.removeItem(ACCOUNT_KEY);
    else sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // The profile can stay in memory when storage is blocked.
  }
}

function rememberSession(user: ApiUser, token: string) {
  writeToken(token);
  return accountFromUser(user);
}

export async function loginWithPassword(email: string, password: string): Promise<AuthAccount> {
  try {
    const body = await apiRequest<{ data: { user: ApiUser; token: string } }>("/login", {
      method: "POST",
      auth: false,
      json: { email: email.trim(), password },
    });
    return rememberSession(body.data.user, body.data.token);
  } catch (error) {
    asAuthError(error);
  }
}

export async function registerAccount(input: RegistrationInput): Promise<RegistrationResult> {
  const form = new FormData();
  form.set("username", input.username.trim());
  form.set("email", input.email.trim());
  form.set("password", input.password);
  form.set("password_confirmation", input.password);
  if (input.avatar) form.set("avatar", input.avatar);
  try {
    const body = await apiRequest<{ data: { user: ApiUser; token: string } }>("/register", {
      method: "POST",
      auth: false,
      body: form,
    });
    return { status: "authenticated", account: rememberSession(body.data.user, body.data.token) };
  } catch (error) {
    asAuthError(error);
  }
}

export async function fetchCurrentAccount(): Promise<AuthAccount | null> {
  if (!readToken()) return null;
  try {
    const body = await apiRequest<{ data: ApiUser }>("/me", { quietUnauthorized: true });
    return accountFromUser(body.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function updateProfile(input: { fullName: string; mobileNumber: string; dateOfBirth: string }): Promise<AuthAccount> {
  const form = new FormData();
  form.set("fullName", input.fullName.trim());
  form.set("mobileNumber", input.mobileNumber.replace(/[\s()-]/g, ""));
  form.set("dateOfBirth", input.dateOfBirth);
  try {
    const body = await apiRequest<{ data: ApiUser }>("/profile", { method: "PUT", body: form });
    return accountFromUser(body.data);
  } catch (error) {
    asAuthError(error);
  }
}

export async function logoutAccount() {
  try {
    await apiRequest("/logout", { method: "POST" });
  } catch {
    // The token is cleared locally even when the server is unreachable.
  }
  writeToken(null);
}

export async function subscribeToComingSoon(movieId: string): Promise<void> {
  try {
    await apiRequest(`/movies/${movieId}/notify`, { method: "POST" });
  } catch (error) {
    asAuthError(error);
  }
}
