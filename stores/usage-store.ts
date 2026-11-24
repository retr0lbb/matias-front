import { create } from "zustand";
import { getUsage, type Usage } from "@/lib/api/usage";
import { useAuthStore } from "./auth-store";

type UsageState = {
  usage: Usage | null;
  status: "idle" | "loading" | "ready" | "error";
  /**
   * Fetches `/usage`. Usage changes with every message, so this refetches
   * each time; the last known numbers stay on screen meanwhile.
   */
  load: () => Promise<void>;
  reset: () => void;
};

// Bumped on reset so a stale answer for a previous user is dropped.
let generation = 0;

export const useUsageStore = create<UsageState>()((set, get) => ({
  usage: null,
  status: "idle",

  load: async () => {
    if (get().status === "loading") return;
    const current = generation;
    set({ status: "loading" });
    try {
      const usage = await getUsage();
      if (current === generation) set({ usage, status: "ready" });
    } catch {
      if (current === generation) set({ status: "error" });
    }
  },

  reset: () => {
    generation++;
    set({ usage: null, status: "idle" });
  },
}));

// A different (or no) user must never see the previous user's usage.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) useUsageStore.getState().reset();
});
