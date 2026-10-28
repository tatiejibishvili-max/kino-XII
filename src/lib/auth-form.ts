const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function emailError(value: string) {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
  return "";
}

export function passwordError(value: string) {
  if (!value) return "Password is required.";
  if (value.length < 3) return "Password must be at least 3 characters.";
  return "";
}

export function avatarError(file: File) {
  if (file.size > 2 * 1024 * 1024) return "Avatar must be 2MB or smaller.";
  const extension = file.name.toLowerCase();
  const extensionOk = [".jpg", ".jpeg", ".png", ".webp"].some((item) => extension.endsWith(item));
  if (file.type) return ACCEPTED_TYPES.has(file.type) ? "" : "Use a JPG, JPEG, PNG, or WebP image.";
  return extensionOk ? "" : "Use a JPG, JPEG, PNG, or WebP image.";
}

export function usernameError(value: string) {
  if (!value.trim()) return "Username is required.";
  if (value.trim().length < 3) return "Username must be at least 3 characters.";
  return "";
}

export function confirmError(password: string, confirm: string) {
  if (!confirm) return "Confirm your password.";
  if (confirm !== password) return "Passwords do not match.";
  return "";
}
