import { create } from "zustand";
import type { DocumentType } from "@/lib/api/conversations";
import type { DocumentView } from "@/lib/api/documents";

/** A generated document, as the chat knows it. */
export type PanelDocument = {
  id: string;
  title: string;
  documentType: DocumentType;
  /** Revisions keep the id and bump this; the preview is always the latest. */
  version: number;
};

type DocumentPanelState = {
  /** The document open in the side panel, if any. */
  document: PanelDocument | null;
  view: DocumentView;
  open: (document: PanelDocument) => void;
  /** Updates the open document in place (e.g. a new version arrived). */
  refresh: (document: PanelDocument) => void;
  setView: (view: DocumentView) => void;
  close: () => void;
};

export const useDocumentPanelStore = create<DocumentPanelState>()((set) => ({
  document: null,
  view: "document",
  open: (document) =>
    set((state) => ({
      document,
      // Opening another document starts on the document, not the key.
      view: state.document?.id === document.id ? state.view : "document",
    })),
  refresh: (document) =>
    set((state) => (state.document?.id === document.id ? { document } : state)),
  setView: (view) => set({ view }),
  close: () => set({ document: null, view: "document" }),
}));
