import { apiFetch } from "./client";

/** A chat in the list (`GET /ai/chat`). Dates arrive as ISO strings. */
export type Conversation = {
  id: string;
  title: string | null;
  createdAt: string;
  /** Set on creation and bumped on every new message; the list's sort key. */
  updatedAt: string;
};

export type ConversationPage = {
  items: Conversation[];
  /** Opaque; send back as is. `null` on the last page. */
  nextCursor: string | null;
};

export const UNTITLED_CONVERSATION = "Nova conversa";

/** Older backend builds return a bare array with a nullable `updatedAt`. */
type LegacyConversation = Omit<Conversation, "updatedAt"> & {
  updatedAt: string | null;
};

/** One page of the user's chats, most recently active first. */
export async function listConversations({
  cursor,
  limit = 30,
}: {
  cursor?: string | null;
  limit?: number;
} = {}): Promise<ConversationPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const data = await apiFetch<ConversationPage | LegacyConversation[]>(
    `/ai/chat?${params}`,
  );
  if (!Array.isArray(data)) return data;

  // Legacy shape: everything in one go, no cursor.
  const items = data
    .map((c) => ({ ...c, updatedAt: c.updatedAt ?? c.createdAt }))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return { items, nextCursor: null };
}

export type ModelTier = "CHEAP" | "NORMAL" | "EXPENSIVE";
export type ThinkingLevel = "DEFAULT" | "HIGH" | "ULTRA_HIGH";
export type DocumentType =
  | "assessment"
  | "homework"
  | "lesson_plan"
  | "course_syllabus"
  | "group_work";

/** A message in `GET /ai/chat/:id` (see the backend's chat-detail.dto.ts). */
export type ApiChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  /** Assistant only; FAILED = the client aborted. The text may be partial. */
  status: "COMPLETED" | "FAILED" | "ERROR" | null;
  thinking: string | null;
  model: {
    tier: ModelTier;
    selection: string;
    thinkingLevel: ThinkingLevel;
    downgradedFrom: ModelTier | null;
    upgradedFrom: ModelTier | null;
  } | null;
  documents?: {
    id: string;
    documentType: DocumentType;
    action: "CREATE" | "REVISE" | "REGENERATE";
    title: string;
    version: number;
  }[];
  attachments?: { id: string; name: string; type: string }[];
  tools?: { name: string; ok: boolean }[];
};

export type ConversationDetail = Conversation & { messages: ApiChatMessage[] };

/** The chat with its messages, oldest first. A chat that isn't yours is 404. */
export function getConversation(id: string) {
  return apiFetch<ConversationDetail>(`/ai/chat/${encodeURIComponent(id)}`);
}

/** Renames a chat. Doesn't bump `updatedAt`, so its place in the list stays. */
export function renameConversation(id: string, title: string) {
  return apiFetch(`/ai/chat/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { title },
  });
}

/** Deletes a chat (204), optionally with the documents it generated. */
export function deleteConversation(
  id: string,
  { deleteDocuments = false }: { deleteDocuments?: boolean } = {},
) {
  const query = deleteDocuments ? "?deleteDocuments=true" : "";
  return apiFetch(`/ai/chat/${encodeURIComponent(id)}${query}`, {
    method: "DELETE",
  });
}
