import { useAuthStore } from "@/stores/auth-store";

/** Browser path that next.config.ts rewrites to the backend. */
export const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown,
    /** Set when a 403 was caused by an unverified e-mail. */
    readonly code?: "EMAIL_NOT_VERIFIED",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Reads the message from a NestJS error body (`message` may be a list). */
export function messageFrom(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("message" in body)) return;
  const { message } = body as { message: unknown };
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * "Verified" routes answer 403 when the e-mail isn't verified, but plan
 * restrictions are also 403, so ask /me which one it is.
 */
async function isEmailUnverified(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/me`, { credentials: "same-origin" });
    if (!res.ok) return false;
    type Me = { emailVerified?: boolean | null };
    const data = (await res.json()) as Me | { rest: Me };
    const me = "rest" in data ? data.rest : data;
    // null counts as not verified, same as everywhere else.
    return me.emailVerified === false || me.emailVerified === null;
  } catch {
    return false;
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * Calls the backend with the session cookie and JSON bodies.
 * Throws ApiError for any non-2xx answer.
 */
export async function apiFetch<T = void>(
  path: string,
  { method = "GET", body, signal }: ApiFetchOptions = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    credentials: "same-origin",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) throw await toApiError(res, path);
  return (await readBody(res)) as T;
}

/**
 * Builds the ApiError for a failed response. A 403 caused by an unverified
 * e-mail also opens the "confirme seu e-mail" popup.
 */
export async function toApiError(res: Response, path: string) {
  const data = await readBody(res);
  let code: ApiError["code"];
  if (res.status === 403 && path !== "/me" && (await isEmailUnverified())) {
    const auth = useAuthStore.getState();
    auth.setEmailVerified(false);
    auth.openVerificationPrompt();
    code = "EMAIL_NOT_VERIFIED";
  }
  return new ApiError(
    res.status,
    messageFrom(data) ?? `Erro ${res.status}`,
    data,
    code,
  );
}
