import { API_BASE, apiFetch } from "./client";

/** `GET /classroom/status`. `email` is the connected Google account. */
export type ClassroomStatus = {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
};

export function getClassroomStatus(signal?: AbortSignal) {
  return apiFetch<ClassroomStatus>("/classroom/status", { signal });
}

/** Revokes the access at Google (best effort) and forgets the connection. */
export function disconnectClassroom() {
  return apiFetch("/classroom/connection", { method: "DELETE" });
}

/**
 * Full-page redirect to Google's consent screen for the Classroom scopes.
 * Needs a signed-in session; the backend sends the user back to `redirectTo`.
 */
export function classroomConnectUrl(redirectTo: string) {
  return `${API_BASE}/auth/oidc/google-classroom/connect?redirectTo=${encodeURIComponent(redirectTo)}`;
}
