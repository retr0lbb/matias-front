import { API_BASE, toApiError } from "./client";
import type { DocumentType, ModelTier, ThinkingLevel } from "./conversations";

export type ModelChoice = "AUTO" | ModelTier;

export type StreamDocument = {
  id: string;
  documentType: DocumentType;
  action: "CREATE" | "REVISE" | "REGENERATE";
  title: string;
  version: number;
};

export type GeneratingStatus = {
  stage: "generating";
  model: ModelTier;
  selection: ModelChoice;
  thinkingLevel: ThinkingLevel;
  title?: string;
  downgradedFrom?: ModelTier;
  upgradedFrom?: ModelTier;
};

export type StreamStatus =
  | { stage: "classifying" | "retrieving" }
  | {
      stage: "documenting" | "document_failed";
      action: StreamDocument["action"];
      documentType: DocumentType;
    }
  | GeneratingStatus;

/** Events of `POST /ai/chat/stream` (backend: src/ai/dto/chat-stream-event.ts). */
export type StreamEvent =
  | { type: "start"; data: { conversationId: string; title: string | null } }
  | { type: "status"; data: StreamStatus }
  | { type: "document"; data: StreamDocument }
  | { type: "thinking"; data: { text: string } }
  | { type: "text"; data: { text: string } }
  | {
      type: "tool";
      data: { name: string; status: "running" | "done" | "error" };
    }
  | {
      type: "done";
      data: { messageId: string; finishReason: string; usage?: unknown };
    }
  /** A quota error body, or `{ code: "GENERATION_FAILED", message }`. */
  | { type: "error"; data: { code?: string; message?: string } };

const EVENT_TYPES = new Set<StreamEvent["type"]>([
  "start",
  "status",
  "document",
  "thinking",
  "text",
  "tool",
  "done",
  "error",
]);

/** Parses one SSE block ("event: x\ndata: {...}") into an event. */
function parseBlock(block: string): StreamEvent | null {
  let type = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") type = value;
    else if (field === "data") data.push(value);
  }
  if (!EVENT_TYPES.has(type as StreamEvent["type"]) || data.length === 0) {
    return null;
  }
  try {
    return { type, data: JSON.parse(data.join("\n")) } as StreamEvent;
  } catch {
    return null;
  }
}

/**
 * Sends a message and calls `onEvent` for each event of the reply.
 * Without `conversationId` the backend starts a new chat (see `start`).
 * Errors before the stream starts (auth, validation, plan) throw ApiError;
 * aborting through `signal` rejects with an AbortError.
 */
export async function streamChat({
  prompt,
  model,
  thinkingLevel,
  conversationId,
  signal,
  onEvent,
}: {
  prompt: string;
  model: ModelChoice;
  thinkingLevel: ThinkingLevel;
  conversationId: string | null;
  signal: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}) {
  const path = "/ai/chat/stream";
  const query = conversationId
    ? `?conversationId=${encodeURIComponent(conversationId)}`
    : "";
  const res = await fetch(`${API_BASE}${path}${query}`, {
    method: "POST",
    signal,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ prompt, model, thinkingLevel }),
  });

  if (!res.ok) throw await toApiError(res, path);
  if (!res.body) throw new Error("A resposta veio sem conteúdo.");

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer = (buffer + value).replace(/\r\n/g, "\n");
    let end = buffer.indexOf("\n\n");
    while (end !== -1) {
      const event = parseBlock(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      if (event) onEvent(event);
      end = buffer.indexOf("\n\n");
    }
  }
  const last = parseBlock(buffer.trim());
  if (last) onEvent(last);
}
