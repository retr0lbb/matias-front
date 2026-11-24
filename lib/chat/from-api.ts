import type { ApiChatMessage } from "@/lib/api/conversations";
import { documentDetail } from "./labels";
import type { AnswerBlock, ChatMessage } from "./types";

/** Turns a saved message from `GET /ai/chat/:id` into what the chat renders. */
export function toChatMessage(message: ApiChatMessage): ChatMessage {
  if (message.role === "user") {
    const attachments = message.attachments ?? [];
    return {
      id: message.id,
      role: "user",
      text: message.text,
      attachments: attachments.length
        ? attachments.map((file) => ({ name: file.name, meta: file.type }))
        : undefined,
    };
  }

  const blocks: AnswerBlock[] = [];
  if (message.text.trim()) {
    blocks.push({ type: "markdown", text: message.text });
  }
  for (const doc of message.documents ?? []) {
    blocks.push({
      type: "document",
      id: doc.id,
      documentType: doc.documentType,
      version: doc.version,
      title: doc.title,
      detail: documentDetail(doc),
    });
  }
  if (message.status === "FAILED") {
    blocks.push({ type: "notice", text: "A resposta foi interrompida." });
  } else if (message.status === "ERROR") {
    blocks.push({
      type: "notice",
      text: "Ocorreu um erro ao gerar esta resposta.",
    });
  } else if (blocks.length === 0) {
    blocks.push({ type: "notice", text: "Resposta vazia." });
  }

  return {
    id: message.id,
    role: "assistant",
    thinking: message.thinking?.trim()
      ? { steps: [{ text: message.thinking }] }
      : undefined,
    tools: message.tools?.length
      ? message.tools.map(({ name, ok }) => ({ name, ok }))
      : undefined,
    blocks,
  };
}
