import { create } from "zustand";
import { type Conversation, listConversations } from "@/lib/api/conversations";
import { useAuthStore } from "./auth-store";

/** Where a chat is being renamed: its sidebar row or the chat header. */
export type RenameTarget = {
  id: string;
  from: "sidebar" | "header";
  /** Set when the last attempt failed; the field reopens with `draft`. */
  error?: string;
  draft?: string;
};

type ConversationsState = {
  conversations: Conversation[];
  status: "idle" | "loading" | "ready" | "error";
  /** Cursor for the next page; `null` once the last page is loaded. */
  nextCursor: string | null;
  loadingMore: boolean;
  loadMoreFailed: boolean;
  /**
   * Loads the first page once. Pass `force` to refetch it, e.g. after the
   * stream's `start` event, since a new chat lands at the top.
   */
  load: (force?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;

  /** The chat whose title is being edited inline, if any. */
  renaming: RenameTarget | null;
  setRenaming: (renaming: RenameTarget | null) => void;
  /** The chat waiting for delete confirmation, if any. */
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  /** Local list updates; the API calls live in lib/chat/conversation-actions. */
  setTitle: (id: string, title: string | null) => void;
  removeLocal: (id: string) => void;
};

const initialState = {
  conversations: [],
  status: "idle",
  nextCursor: null,
  loadingMore: false,
  loadMoreFailed: false,
  renaming: null,
  deletingId: null,
} satisfies Partial<ConversationsState>;

// Bumped on reset/force so answers to stale requests are dropped.
let generation = 0;

export const useConversationsStore = create<ConversationsState>()(
  (set, get) => ({
    ...initialState,

    load: async (force = false) => {
      const { status } = get();
      if (!force && (status === "loading" || status === "ready")) return;
      const current = ++generation;
      set({ status: "loading", loadMoreFailed: false });
      try {
        const page = await listConversations();
        if (current !== generation) return;
        set({
          conversations: page.items,
          nextCursor: page.nextCursor,
          status: "ready",
        });
      } catch {
        if (current === generation) set({ status: "error" });
      }
    },

    loadMore: async () => {
      const { nextCursor, loadingMore, status } = get();
      if (!nextCursor || loadingMore || status !== "ready") return;
      const current = generation;
      set({ loadingMore: true, loadMoreFailed: false });
      try {
        const page = await listConversations({ cursor: nextCursor });
        if (current !== generation) return;
        set((state) => {
          // Activity can move a chat between pages; keep the first copy.
          const seen = new Set(state.conversations.map((c) => c.id));
          return {
            conversations: [
              ...state.conversations,
              ...page.items.filter((c) => !seen.has(c.id)),
            ],
            nextCursor: page.nextCursor,
            loadingMore: false,
          };
        });
      } catch {
        if (current === generation) {
          set({ loadingMore: false, loadMoreFailed: true });
        }
      }
    },

    reset: () => {
      generation++;
      set(initialState);
    },

    setRenaming: (renaming) => set({ renaming }),
    setDeletingId: (deletingId) => set({ deletingId }),
    setTitle: (id, title) =>
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, title } : c,
        ),
      })),
    removeLocal: (id) =>
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
      })),
  }),
);

// A different (or no) user must never see the previous user's chats.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    useConversationsStore.getState().reset();
  }
});
