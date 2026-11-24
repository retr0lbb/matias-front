import { create } from "zustand";
import {
  type ClassroomStatus,
  disconnectClassroom,
  getClassroomStatus,
} from "@/lib/api/classroom";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "./auth-store";

type ClassroomState = {
  status: ClassroomStatus | null;
  loading: "idle" | "loading" | "ready" | "error";
  /** Fetches `/classroom/status`; the last known status stays meanwhile. */
  load: () => Promise<void>;
  /** Throws with a readable message when the backend refuses. */
  disconnect: () => Promise<void>;
  reset: () => void;
};

// Bumped on reset so a stale answer for a previous user is dropped.
let generation = 0;

export const useClassroomStore = create<ClassroomState>()((set, get) => ({
  status: null,
  loading: "idle",

  load: async () => {
    if (get().loading === "loading") return;
    const current = generation;
    set({ loading: "loading" });
    try {
      const status = await getClassroomStatus();
      if (current === generation) set({ status, loading: "ready" });
    } catch {
      if (current === generation) set({ loading: "error" });
    }
  },

  disconnect: async () => {
    const current = generation;
    try {
      await disconnectClassroom();
    } catch (error) {
      // Already gone counts as disconnected.
      if (!(error instanceof ApiError && error.status === 404)) {
        throw new Error("Não foi possível desconectar. Tente novamente.");
      }
    }
    if (current === generation) {
      set({
        status: { connected: false, email: null, connectedAt: null },
        loading: "ready",
      });
    }
  },

  reset: () => {
    generation++;
    set({ status: null, loading: "idle" });
  },
}));

// A different (or no) user must never see the previous user's connection.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id)
    useClassroomStore.getState().reset();
});
