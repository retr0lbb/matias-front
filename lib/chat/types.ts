import type { DocumentType } from "@/lib/api/conversations";

export type ChatAttachment = {
  name: string;
  /** e.g. "PDF · 24 páginas" */
  meta?: string;
};

export type ThinkingStep = {
  title?: string;
  text: string;
};

/** Advanced reasoning: a collapsible trace of steps shown above the answer. */
export type DetailedThinking = {
  /** Unknown for saved messages, which only keep the thinking text. */
  seconds?: number;
  steps: ThinkingStep[];
};

export type AnswerBlock =
  | { type: "paragraph"; text: string }
  /** Assistant reply text, written in Markdown (GFM). */
  | { type: "markdown"; text: string }
  | {
      type: "numbered-list";
      items: { title: string; detail: string }[];
    }
  | {
      type: "document";
      id: string;
      documentType: DocumentType;
      version: number;
      title: string;
      detail: string;
    }
  | { type: "change-summary"; label: string }
  | { type: "notice"; text: string };

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
  attachments?: ChatAttachment[];
};

/** A Classroom tool the assistant called while answering. */
export type ToolCall = { name: string; ok: boolean };

export type AssistantMessage = {
  id: string;
  /** Set on replies streamed in this session: the live reply's list key. */
  clientKey?: string;
  role: "assistant";
  thinking?: DetailedThinking;
  tools?: ToolCall[];
  blocks: AnswerBlock[];
};

export type ChatMessage = UserMessage | AssistantMessage;

/** Simple reasoning: the live "thinking" line while a reply is generated. */
export type PendingReply = {
  startedAt: number;
  phase: string;
};
