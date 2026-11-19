import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ModelId = "base" | "avancado" | "ultra";
export type ReasoningId = "padrao" | "alto" | "ultra";

type UiState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  /** Composer model / reasoning choice, shared by every composer. */
  model: ModelId;
  reasoning: ReasoningId;
  setModel: (model: ModelId) => void;
  setReasoning: (reasoning: ReasoningId) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      model: "avancado",
      reasoning: "alto",
      setModel: (model) => set({ model }),
      setReasoning: (reasoning) => set({ reasoning }),
    }),
    {
      name: "matias-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        model: state.model,
        reasoning: state.reasoning,
      }),
      // Rehydrated on the client by <StoreHydration /> to avoid SSR mismatches.
      skipHydration: true,
    },
  ),
);
