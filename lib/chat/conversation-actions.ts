import { ApiError } from "@/lib/api/client";
import {
  deleteConversation,
  renameConversation,
} from "@/lib/api/conversations";
import { useChatStore } from "@/stores/chat-store";
import { useConversationsStore } from "@/stores/conversations-store";

/** Longest title we send; longer input is cut, not rejected. */
export const TITLE_MAX_LENGTH = 120;

function actionError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 404) return "Esta conversa não existe mais.";
    if (error.code === "EMAIL_NOT_VERIFIED") {
      return "Confirme seu e-mail para alterar suas conversas.";
    }
  }
  return fallback;
}

/**
 * Renames a chat optimistically: the new title shows at once and is rolled
 * back (with the editor reopened on the draft) if the request fails.
 */
export async function renameChat(
  id: string,
  rawTitle: string,
  from: "sidebar" | "header",
) {
  const conversations = useConversationsStore.getState();
  const chat = useChatStore.getState();
  const previous =
    conversations.conversations.find((c) => c.id === id)?.title ??
    chat.threads[id]?.title ??
    null;
  const title = rawTitle.trim().slice(0, TITLE_MAX_LENGTH);

  conversations.setRenaming(null);
  if (!title || title === previous) return;

  conversations.setTitle(id, title);
  chat.setThreadTitle(id, title);
  try {
    await renameConversation(id, title);
  } catch (error) {
    useConversationsStore.getState().setTitle(id, previous);
    useChatStore.getState().setThreadTitle(id, previous);
    useConversationsStore.getState().setRenaming({
      id,
      from,
      draft: title,
      error: actionError(error, "Não foi possível renomear. Tente de novo."),
    });
  }
}

/**
 * Deletes a chat on the backend, then forgets it locally. Throws a message
 * ready to show if it fails. A reply still streaming into it is stopped.
 */
export async function deleteChat(id: string, deleteDocuments: boolean) {
  const chat = useChatStore.getState();
  if (chat.live?.conversationId === id) chat.stop();

  try {
    await deleteConversation(id, { deleteDocuments });
  } catch (error) {
    // Already gone counts as done: just drop it from the list.
    if (!(error instanceof ApiError && error.status === 404)) {
      throw new Error(
        actionError(error, "Não foi possível excluir a conversa."),
      );
    }
  }
  useConversationsStore.getState().removeLocal(id);
}

/** Drops a deleted chat's messages; call once it's no longer on screen. */
export function forgetChat(id: string) {
  useChatStore.getState().removeThread(id);
}
