"use client";

import { useEffect } from "react";
import { getMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

let refreshed = false;

/**
 * Replaces the stored user with `GET /me` once per page load, so the account
 * card shows current data. A 401 means the session expired: clearing the user
 * lets AuthGuard send them to /login.
 */
export function useRefreshUser() {
  useEffect(() => {
    if (refreshed) return;
    refreshed = true;
    getMe()
      .then((me) => useAuthStore.getState().setUser(me))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          useAuthStore.getState().signOut();
        }
        refreshed = false;
      });
  }, []);
}
