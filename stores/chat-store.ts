import { create } from "zustand";
import {
  type GeneratingStatus,
  type StreamDocument,
  type StreamEvent,
  streamChat,
} from "@/lib/api/chat-stream";
import { ApiError, messageFrom } from "@/lib/api/client";
import type { DocumentType } from "@/lib/api/conversations";
import { documentDetail } from "@/lib/chat/labels";
import { MODEL_TO_API, REASONING_TO_API } from "@/lib/chat/model-options";
import type {
  AnswerBlock,
  AssistantMessage,
  ChatAttachment,
  ChatMessage,
  UserMessage,
} from "@/lib/chat/types";
import { useAuthStore } from "./auth-store";
import { useConversationsStore } from "./conversations-store";
import { useUiStore } from "./ui-store";

export type Thread = { title: string | null; messages: ChatMessage[] };

export type LiveTool = {
  name: string;
  status: "running" | "done" | "error";
};

/** The reply being streamed right now, rebuilt from the SSE events. */
export type LiveReply = {
  /** `null` until the `start` event of a new chat arrives. */
  conversationId: string | null;
  startedAt: number;
  stage:
    | "sending"
    | "classifying"
    | "retrieving"
    | "documenting"
    | "generating";
  /** The document being made while `stage` is "documenting". */
  documenting: {
    action: StreamDocument["action"];
    documentType: DocumentType;
  } | null;
  failedDocuments: DocumentType[];
  documents: StreamDocument[];
  generating: GeneratingStatus | null;
  thinking: string;
  thinkingStartedAt: number | null;
  /** Set when the answer text starts, which ends the thinking phase. */
  thinkingEndedAt: number | null;
  text: string;
  tools: LiveTool[];
  /**
   * Set when the stream has ended. The UI keeps revealing the text and then
   * calls `commit()` (or a timer does), which moves this into the thread.
   */
  ending: AssistantMessage | null;
};

/** Thread key of a chat whose first message is out but has no id yet. */
export const NEW_CHAT_ID = "new";

/** How long the UI may take to finish revealing the text before we commit. */
const COMMIT_FALLBACK_MS = 2500;

type SendInput = {
  prompt: string;
  /** `null` starts a new chat (kept under NEW_CHAT_ID until `start`). */
  conversationId: string | null;
  /** Shown on the user message (the files were uploaded beforehand). */
  attachments?: ChatAttachment[];
  /**
   * For a new chat: the id to create it with, because files were already
   * uploaded into it. The backend creates the conversation with this id.
   */
  newConversationId?: string | null;
};

type ChatState = {
  /** Messages per conversation id, loaded once or built while chatting. */
  threads: Record<string, Thread>;
  live: LiveReply | null;
  /** Id the backend gave the last new chat (`start`), to update the URL. */
  startedConversationId: string | null;
  setThread: (conversationId: string, thread: Thread) => void;
  setThreadTitle: (conversationId: string, title: string | null) => void;
  removeThread: (conversationId: string) => void;
  /** Clears the NEW_CHAT_ID thread, before the first message of a new chat. */
  beginNewChat: () => void;
  send: (input: SendInput) => Promise<void>;
  stop: () => void;
  /** Moves the ended live reply into its thread. */
  commit: () => void;
  reset: () => void;
};

let controller: AbortController | null = null;
let commitTimer: ReturnType<typeof setTimeout> | null = null;
let messageCounter = 0;
function localId(prefix: string) {
  messageCounter += 1;
  return `${prefix}_${Date.now()}_${messageCounter}`;
}

function streamErrorMessage(error: ApiError) {
  if (error.code === "EMAIL_NOT_VERIFIED") {
    return "Confirme seu e-mail para conversar com o MATIAS.";
  }
  switch (error.status) {
    case 429:
      return (
        messageFrom(error.body) ??
        "Você atingiu o limite de mensagens deste ciclo."
      );
    case 403:
      return (
        messageFrom(error.body) ??
        "Seu plano não inclui esse modelo ou nível de raciocínio."
      );
    case 404:
      return "Esta conversa não existe mais.";
    default:
      return error.status < 500
        ? error.message
        : "O MATIAS está com problemas agora. Tente novamente em instantes.";
  }
}

/** Turns what was streamed into a regular assistant message. */
function finalize(
  live: LiveReply,
  id: string,
  notice?: string,
): AssistantMessage {
  const blocks: AnswerBlock[] = [];
  if (live.text.trim()) blocks.push({ type: "markdown", text: live.text });
  for (const doc of live.documents) {
    blocks.push({
      type: "document",
      id: doc.id,
      documentType: doc.documentType,
      version: doc.version,
      title: doc.title,
      detail: documentDetail(doc),
    });
  }
  if (notice) blocks.push({ type: "notice", text: notice });
  if (blocks.length === 0)
    blocks.push({ type: "notice", text: "Resposta vazia." });

  const thinkingEnd = live.thinkingEndedAt ?? Date.now();
  return {
    id,
    role: "assistant",
    thinking: live.thinking.trim()
      ? {
          seconds: Math.max(
            1,
            Math.round(
              (thinkingEnd - (live.thinkingStartedAt ?? live.startedAt)) / 1000,
            ),
          ),
          steps: [{ text: live.thinking }],
        }
      : undefined,
    // A call still "running" when the stream ended never finished.
    tools: live.tools.length
      ? live.tools.map(({ name, status }) => ({ name, ok: status === "done" }))
      : undefined,
    blocks,
  };
}

/** Applies one SSE event to the live reply. */
function reduce(live: LiveReply, event: StreamEvent): LiveReply {
  switch (event.type) {
    case "status": {
      const status = event.data;
      if (status.stage === "documenting") {
        return {
          ...live,
          stage: "documenting",
          documenting: {
            action: status.action,
            documentType: status.documentType,
          },
        };
      }
      if (status.stage === "document_failed") {
        return {
          ...live,
          documenting: null,
          failedDocuments: [...live.failedDocuments, status.documentType],
        };
      }
      if (status.stage === "generating") {
        return {
          ...live,
          stage: "generating",
          documenting: null,
          generating: status,
        };
      }
      return { ...live, stage: status.stage };
    }
    case "document":
      return {
        ...live,
        documenting: null,
        documents: [
          ...live.documents.filter((d) => d.id !== event.data.id),
          event.data,
        ],
      };
    case "thinking":
      return {
        ...live,
        thinking: live.thinking + event.data.text,
        thinkingStartedAt: live.thinkingStartedAt ?? Date.now(),
      };
    case "text":
      return {
        ...live,
        stage: "generating",
        text: live.text + event.data.text,
        thinkingEndedAt:
          live.thinkingEndedAt ?? (live.thinking ? Date.now() : null),
      };
    case "tool": {
      const tools = [...live.tools];
      // Update the last running call of this tool, or add a new one.
      let index = -1;
      for (let i = tools.length - 1; i >= 0; i--) {
        if (
          tools[i].name === event.data.name &&
          tools[i].status === "running"
        ) {
          index = i;
          break;
        }
      }
      if (index === -1 || event.data.status === "running")
        tools.push(event.data);
      else tools[index] = event.data;
      return { ...live, tools };
    }
    default:
      return live;
  }
}

export const useChatStore = create<ChatState>()((set, get) => {
  /** Appends a message to a conversation's thread. */
  function append(conversationId: string, message: ChatMessage) {
    set((state) => {
      const thread = state.threads[conversationId] ?? {
        title: null,
        messages: [],
      };
      return {
        threads: {
          ...state.threads,
          [conversationId]: {
            ...thread,
            messages: [...thread.messages, message],
          },
        },
      };
    });
  }

  return {
    threads: {},
    live: null,
    startedConversationId: null,

    setThread: (conversationId, thread) =>
      set((state) => ({
        threads: { ...state.threads, [conversationId]: thread },
      })),

    setThreadTitle: (conversationId, title) =>
      set((state) => {
        const thread = state.threads[conversationId];
        if (!thread) return state;
        return {
          threads: { ...state.threads, [conversationId]: { ...thread, title } },
        };
      }),

    removeThread: (conversationId) =>
      set((state) => {
        if (!(conversationId in state.threads)) return state;
        const { [conversationId]: _, ...threads } = state.threads;
        return { threads };
      }),

    beginNewChat: () =>
      set((state) => ({
        startedConversationId: null,
        threads: {
          ...state.threads,
          [NEW_CHAT_ID]: { title: null, messages: [] },
        },
      })),

    send: async ({
      prompt,
      conversationId,
      attachments,
      newConversationId,
    }) => {
      if (get().live) return;
      const { model, reasoning } = useUiStore.getState();
      const userMessage: UserMessage = {
        id: localId("user"),
        role: "user",
        text: prompt,
        attachments: attachments?.length ? attachments : undefined,
      };

      append(conversationId ?? NEW_CHAT_ID, userMessage);
      controller = new AbortController();
      const signal = controller.signal;
      set({
        live: {
          conversationId,
          startedAt: Date.now(),
          stage: "sending",
          documenting: null,
          failedDocuments: [],
          documents: [],
          generating: null,
          thinking: "",
          thinkingStartedAt: null,
          thinkingEndedAt: null,
          text: "",
          tools: [],
          ending: null,
        },
      });

      let doneMessageId: string | null = null;
      let streamError: string | null = null;

      /** The stream is over: hand the final message to the UI to commit. */
      const finish = (notice?: string) => {
        controller = null;
        const live = get().live;
        if (!live || live.ending) return;
        const message = finalize(
          live,
          doneMessageId ?? localId("assistant"),
          notice,
        );
        set({ live: { ...live, ending: message } });
        // If the reply isn't on screen (or the tab is hidden), nobody will
        // call commit() after revealing it, so do it anyway.
        commitTimer = setTimeout(() => get().commit(), COMMIT_FALLBACK_MS);
      };

      try {
        await streamChat({
          prompt,
          conversationId: conversationId ?? newConversationId ?? null,
          model: MODEL_TO_API[model] ?? "AUTO",
          thinkingLevel: REASONING_TO_API[reasoning] ?? "DEFAULT",
          signal,
          onEvent: (event) => {
            const live = get().live;
            if (!live || signal.aborted) return;
            if (event.type === "start") {
              const id = event.data.conversationId;
              set((state) => {
                const threads = { ...state.threads };
                const pending = threads[NEW_CHAT_ID];
                const current = threads[id];
                if (!live.conversationId && pending) {
                  // The new chat got its id: move the draft thread under it.
                  threads[id] = { ...pending, title: event.data.title };
                  delete threads[NEW_CHAT_ID];
                } else if (current && !current.title && event.data.title) {
                  threads[id] = { ...current, title: event.data.title };
                }
                return {
                  threads,
                  live: { ...live, conversationId: id },
                  startedConversationId: live.conversationId
                    ? state.startedConversationId
                    : id,
                };
              });
              // The chat is new or just moved to the top of the list.
              useConversationsStore.getState().load(true);
              return;
            }
            if (event.type === "done") {
              doneMessageId = event.data.messageId;
              return;
            }
            if (event.type === "error") {
              streamError =
                event.data.message ??
                (event.data.code === "GENERATION_FAILED"
                  ? "Não foi possível gerar a resposta."
                  : "Você atingiu um limite do seu plano.");
              return;
            }
            set({ live: reduce(live, event) });
          },
        });
        if (streamError) finish(streamError);
        else if (doneMessageId) finish();
        else finish("A resposta terminou antes do fim. Tente de novo.");
      } catch (error) {
        if (signal.aborted) {
          finish("Você interrompeu a resposta.");
        } else if (error instanceof ApiError) {
          finish(streamErrorMessage(error));
        } else {
          finish("A conexão caiu durante a resposta. Tente de novo.");
        }
      }
    },

    stop: () => controller?.abort(),

    commit: () => {
      if (commitTimer) clearTimeout(commitTimer);
      commitTimer = null;
      const live = get().live;
      if (!live?.ending) return;
      append(live.conversationId ?? NEW_CHAT_ID, live.ending);
      set({ live: null });
      // `updatedAt` changed, so the chat moves to the top of the list.
      useConversationsStore.getState().load(true);
    },

    reset: () => {
      controller?.abort();
      controller = null;
      if (commitTimer) clearTimeout(commitTimer);
      commitTimer = null;
      set({ threads: {}, live: null, startedConversationId: null });
    },
  };
});

// Never keep one user's messages around for the next one.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) useChatStore.getState().reset();
});
