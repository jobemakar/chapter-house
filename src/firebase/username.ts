const INTERNAL_MEMBER_DOMAIN = "members.chapter-house.invalid";
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,22}[a-z0-9])?$/;

export class InvalidUsernameError extends Error {
  constructor() {
    super(
      "Use 3–24 letters, numbers, dots, underscores, or hyphens. Start and end with a letter or number.",
    );
    this.name = "InvalidUsernameError";
  }
}

export function normalizeUsername(value: string): string {
  const username = value.trim().toLowerCase();
  if (
    username.length < 3 ||
    username.length > 24 ||
    !USERNAME_PATTERN.test(username)
  )
    throw new InvalidUsernameError();
  return username;
}

export function usernameToInternalEmail(value: string): string {
  return `${normalizeUsername(value)}@${INTERNAL_MEMBER_DOMAIN}`;
}

export function usernameFromInternalEmail(
  email: string | null | undefined,
): string | null {
  if (!email) return null;
  const suffix = `@${INTERNAL_MEMBER_DOMAIN}`;
  if (!email.toLowerCase().endsWith(suffix)) return null;
  try {
    return normalizeUsername(email.slice(0, -suffix.length));
  } catch {
    return null;
  }
}
