"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFakeReply,
  createMessageId,
  FAKE_REPLY_DELAY,
  THINKING_PHASES,
} from "@/lib/chat/fake-assistant";
import type {
  ChatAttachment,
  ChatMessage,
  PendingReply,
  UserMessage as UserMessageType,
} from "@/lib/chat/types";
import { useUiStore } from "@/stores/ui-store";
import { Composer } from "../composer";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { AssistantMessage, PendingAssistantMessage } from "./assistant-message";
import { ChatHeader } from "./chat-header";
import { UserMessage } from "./user-message";

const PHASE_INTERVAL = 1400;

type ChatViewProps = {
  title: string;
  initialMessages: ChatMessage[];
};

/**
 * Full chat screen: header, scrollable thread and composer.
 * Replies come from a fake assistant until the real API is wired in.
 */
export function ChatView({ title, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [pending, setPending] = useState<PendingReply | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) {
      clearTimeout(t);
      clearInterval(t);
    }
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startReply = useCallback(
    (user: UserMessageType) => {
      clearTimers();
      const startedAt = Date.now();
      const reasoning = useUiStore.getState().reasoning;
      setPending({ startedAt, phase: THINKING_PHASES[0] });

      let phase = 0;
      timers.current.push(
        setInterval(() => {
          phase = Math.min(phase + 1, THINKING_PHASES.length - 1);
          setPending((p) => (p ? { ...p, phase: THINKING_PHASES[phase] } : p));
        }, PHASE_INTERVAL),
        setTimeout(() => {
          clearTimers();
          const reply = createFakeReply(
            user,
            reasoning,
            Date.now() - startedAt,
          );
          setMessages((list) => [...list, reply]);
          setPending(null);
        }, FAKE_REPLY_DELAY[reasoning]),
      );
    },
    [clearTimers],
  );

  function send(text: string, attachments: ChatAttachment[]) {
    const user: UserMessageType = {
      id: createMessageId(),
      role: "user",
      text,
      attachments: attachments.length ? attachments : undefined,
    };
    setMessages((list) => [...list, user]);
    startReply(user);
  }

  function stop() {
    clearTimers();
    setPending(null);
    setMessages((list) => [
      ...list,
      {
        id: createMessageId(),
        role: "assistant",
        blocks: [{ type: "notice", text: "Você interrompeu a resposta." }],
      },
    ]);
  }

  function regenerate(assistantId: string) {
    const index = messages.findIndex((m) => m.id === assistantId);
    const previous = messages[index - 1];
    if (index < 1 || previous?.role !== "user") return;
    // Drop this answer and everything after it, then answer again.
    setMessages(messages.slice(0, index));
    startReply(previous);
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <ChatHeader title={title} />

      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="flex-1">
          <MessageScrollerViewport aria-label="Mensagens da conversa">
            <MessageScrollerContent className="mx-auto w-full max-w-180 gap-6 px-6 pt-4 pb-8">
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  {message.role === "user" ? (
                    <UserMessage message={message} />
                  ) : (
                    <AssistantMessage
                      message={message}
                      onRegenerate={
                        pending ? undefined : () => regenerate(message.id)
                      }
                    />
                  )}
                </MessageScrollerItem>
              ))}
              {pending && (
                <MessageScrollerItem messageId="pending">
                  <PendingAssistantMessage pending={pending} />
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="mx-auto w-full max-w-180 shrink-0 px-6 pb-2 lg:px-0">
        <Composer
          variant="thread"
          placeholder="Responda ou peça outra coisa…"
          isGenerating={Boolean(pending)}
          onSend={send}
          onStop={stop}
        />
      </div>
      <p className="shrink-0 pb-3.5 text-center text-xs text-ink-3">
        O MATIAS pode errar. Revise o material antes de publicar para seus
        alunos.
      </p>
    </div>
  );
}
