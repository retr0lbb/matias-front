"use client";

import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

/** True once the auth store has loaded the user from browser storage. */
export function useAuthHydrated() {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

type AuthGuardProps = {
  children: ReactNode;
  /**
   * "authenticated": only signed-in users (else → /login).
   * "guest": only signed-out users (else → /).
   */
  require?: "authenticated" | "guest";
};

export function AuthGuard({
  children,
  require = "authenticated",
}: AuthGuardProps) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  // Before sending a signed-out user to /login, ask the backend whether a
  // session cookie exists anyway (e.g. right after Google sign-in).
  const [sessionChecked, setSessionChecked] = useState(false);
  // Guest pages only turn away users who arrive signed in. A sign-in made on
  // the page itself (login, register) navigates on its own; redirecting here
  // too would race it (register → /check-email ended up on /).
  const [signedInOnArrival, setSignedInOnArrival] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (hydrated && signedInOnArrival === null) {
      setSignedInOnArrival(Boolean(useAuthStore.getState().user));
    }
  }, [hydrated, signedInOnArrival]);

  const allowed =
    require === "authenticated" ? Boolean(user) : signedInOnArrival === false;
  const mustCheckSession =
    require === "authenticated" && hydrated && !user && !sessionChecked;

  useEffect(() => {
    if (!mustCheckSession) return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) signIn(me, true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSessionChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mustCheckSession, signIn]);

  // Whether we know enough to send the user elsewhere.
  const decided =
    require === "guest"
      ? signedInOnArrival !== null
      : hydrated && !mustCheckSession;

  useEffect(() => {
    if (decided && !allowed) {
      router.replace(require === "authenticated" ? "/login" : "/");
    }
  }, [decided, allowed, require, router]);

  // Render nothing until we know the session state, to avoid flashing
  // protected content (or the login form) before redirecting.
  if (!hydrated || !allowed) return null;

  return children;
}
