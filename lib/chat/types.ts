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
  | {
      type: "numbered-list";
      items: { title: string; detail: string }[];
    }
  | { type: "document"; title: string; detail: string; open?: boolean }
  | { type: "change-summary"; label: string }
  | { type: "notice"; text: string };

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
  attachments?: ChatAttachment[];
};

export type AssistantMessage = {
  id: string;
  role: "assistant";
  thinking?: DetailedThinking;
  blocks: AnswerBlock[];
};

export type ChatMessage = UserMessage | AssistantMessage;

/** Simple reasoning: the live "thinking" line while a reply is generated. */
export type PendingReply = {
  startedAt: number;
  phase: string;
};
