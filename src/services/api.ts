/**
 * Kino XII API client.
 * Docs: https://api.kinoxii.redberryinternship.ge/docs
 * The token is kept for this browser tab only. Passwords are never stored.
 */
const TOKEN_KEY = "kino-xii-token";

export const API_BASE = "https://api.kinoxii.redberryinternship.ge/api";

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // The signed-in request can still use the token held in memory for this call.
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly contested: string[];

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, contested: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.contested = contested;
  }
}

interface RequestOptions {
  method?: string;
  json?: unknown;
  body?: BodyInit;
  auth?: boolean;
  quietUnauthorized?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }
  if (options.auth !== false) {
    const token = readToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  if (response.status === 401 && options.auth !== false) {
    writeToken(null);
    if (!options.quietUnauthorized && !handlingUnauthorized) {
      handlingUnauthorized = true;
      try {
        onUnauthorized?.();
      } finally {
        handlingUnauthorized = false;
      }
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    errors?: Record<string, string[]>;
    contested?: string[];
  } | null;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(body?.errors ?? {})) {
    const message = Array.isArray(messages) ? messages[0] : "";
    if (message) fieldErrors[key] = message;
  }
  if (fieldErrors.password_confirmation) fieldErrors.confirmPassword = fieldErrors.password_confirmation;
  if (fieldErrors.mobileNumber) fieldErrors.mobile = fieldErrors.mobileNumber;
  return new ApiError(
    response.status,
    body?.message || "The request failed.",
    fieldErrors,
    Array.isArray(body?.contested) ? body.contested : [],
  );
}
