"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

/** Loads persisted zustand state from browser storage after hydration. */
export function StoreHydration() {
  useEffect(() => {
    useUiStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
  }, []);

  return null;
}
