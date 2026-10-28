import { ApiError } from "../services/api";

export function errorStatus(error: unknown): number | null {
  if (error instanceof ApiError) return error.status;
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

function specificMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const message = error.message.trim();
  if (!message || message === "The request failed." || message.length > 160) return null;
  if (/exception|stack trace|sql|syntax error|undefined|token/i.test(message)) return null;
  return message;
}

/** User-facing copy. Field-level 422 messages are shown on the inputs and are not replaced here. */
export function userMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return "Check your connection and try again.";
  const status = errorStatus(error);
  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 404) return "We couldn't find that.";
  if (status === 409) return "That selection is no longer available. Choose another option.";
  if (status !== null && status >= 500) return "Something went wrong on our side. Please try again.";
  const specific = specificMessage(error);
  if (status === 422) return specific ?? "Check the highlighted fields and try again.";
  return specific ?? fallback;
}
