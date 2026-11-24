import type { SessionUser } from "@/stores/auth-store";
import { API_BASE, apiFetch } from "./client";

/** The user as the backend returns it (e.g. `GET /me`). */
type RawUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean | null;
  loginProvider?: "LOCAL" | "GOOGLE";
  googleSubject?: string | null;
  createdAt?: string;
  cycleAnchorAt?: string;
};

/**
 * Some backend builds wrap the user as `{ rest: user }` (from a
 * `const { password, ...rest } = user; return { rest }`), so accept both.
 */
export function unwrapUser<T extends object>(data: T | { rest: T }): T {
  return "rest" in data && data.rest && typeof data.rest === "object"
    ? data.rest
    : (data as T);
}

function toSessionUser(raw: RawUser): SessionUser {
  // Fail loudly instead of storing an empty user if the shape changes again.
  if (!raw || typeof raw.email !== "string") {
    throw new Error("Resposta inesperada do servidor para o usuário.");
  }
  return {
    id: raw.id,
    name: raw.name ?? raw.email,
    email: raw.email,
    emailVerified: raw.emailVerified ?? false,
    loginProvider: raw.loginProvider,
  };
}

/** Creates the account, signs the user in (cookie) and sends the e-mail. */
export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  const user = await apiFetch<RawUser | { rest: RawUser }>("/auth/register", {
    method: "POST",
    body: input,
  });
  return toSessionUser(unwrapUser(user));
}

/** Sets the session cookie. Wrong credentials throw ApiError 401. */
export function login(input: { email: string; password: string }) {
  return apiFetch<{ mfaRequired: boolean }>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function getMe(): Promise<SessionUser> {
  const data = await apiFetch<RawUser | { rest: RawUser }>("/me");
  return toSessionUser(unwrapUser(data));
}

/** Ends this browser's session and clears the cookie (204). Never throws on a missing session. */
export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

/** Confirms the e-mail from the link's token. Bad tokens throw ApiError 400. */
export function verifyEmail(token: string) {
  return apiFetch<{ email: string; emailVerified: true }>(
    "/auth/email/verify",
    { method: "POST", body: { token } },
  );
}

/** Resends the link (202). Throws ApiError 409 if already verified. */
export function resendVerificationEmail() {
  return apiFetch("/auth/email/verification", { method: "POST" });
}

/** Full-page redirect to Google; the backend sends the user back to `redirectTo`. */
export function googleLoginUrl(redirectTo: string) {
  return `${API_BASE}/auth/oidc/google/login?redirectTo=${encodeURIComponent(redirectTo)}`;
}
