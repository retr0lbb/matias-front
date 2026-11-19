"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth-store";

/** True once the auth store has loaded the token from browser storage. */
function useAuthHydrated() {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

type AuthGuardProps = {
  children: ReactNode;
  /**
   * "authenticated": only logged-in users (else → /login).
   * "guest": only logged-out users (else → /).
   */
  require?: "authenticated" | "guest";
};

export function AuthGuard({
  children,
  require = "authenticated",
}: AuthGuardProps) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const hostId = useAuthStore((s) => s.hostId);

  const allowed = require === "authenticated" ? Boolean(hostId) : !hostId;

  useEffect(() => {
    if (hydrated && !allowed) {
      router.replace(require === "authenticated" ? "/login" : "/");
    }
  }, [hydrated, allowed, require, router]);

  // Render nothing until we know the session state, to avoid flashing
  // protected content (or the login form) before redirecting.
  if (!hydrated || !allowed) return null;

  return children;
}
