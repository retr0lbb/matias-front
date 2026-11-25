import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ModelId = "auto" | "base" | "avancado" | "ultra";
export type ReasoningId = "padrao" | "alto" | "ultra";

type UiState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  /** Mobile drawer with the sidebar; not persisted. */
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  /** Composer model / reasoning choice, shared by every composer. */
  model: ModelId;
  reasoning: ReasoningId;
  setModel: (model: ModelId) => void;
  setReasoning: (reasoning: ReasoningId) => void;

  /** Width of the document side panel, in px (clamped by the layout). */
  documentPanelWidth: number;
  setDocumentPanelWidth: (width: number) => void;

  /**
   * Text for the home composer to start with (e.g. a tool's example prompt).
   * The composer takes it once; not persisted.
   */
  composerDraft: string | null;
  setComposerDraft: (draft: string | null) => void;
};

export const DEFAULT_DOCUMENT_PANEL_WIDTH = 560;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      mobileSidebarOpen: false,
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),

      model: "auto",
      reasoning: "alto",
      setModel: (model) => set({ model }),
      setReasoning: (reasoning) => set({ reasoning }),

      documentPanelWidth: DEFAULT_DOCUMENT_PANEL_WIDTH,
      setDocumentPanelWidth: (documentPanelWidth) =>
        set({ documentPanelWidth }),

      composerDraft: null,
      setComposerDraft: (composerDraft) => set({ composerDraft }),
    }),
    {
      name: "matias-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        model: state.model,
        reasoning: state.reasoning,
        documentPanelWidth: state.documentPanelWidth,
      }),
      // Rehydrated on the client by <StoreHydration /> to avoid SSR mismatches.
      skipHydration: true,
    },
  ),
);
