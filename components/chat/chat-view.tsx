"use client";

import { UNTITLED_CONVERSATION } from "@/lib/api/conversations";
import { NEW_CHAT_ID, useChatStore } from "@/stores/chat-store";
import { useConversationsStore } from "@/stores/conversations-store";
import { Composer } from "../composer";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { AssistantMessage } from "./assistant-message";
import { ChatHeader } from "./chat-header";
import { LiveAssistantMessage } from "./live-assistant-message";
import { UserMessage } from "./user-message";

const NO_MESSAGES: never[] = [];

/**
 * Full chat screen: header, scrollable thread and composer. Messages come
 * from the chat store; the reply being streamed is shown live at the end.
 */
export function ChatView({ conversationId }: { conversationId: string }) {
  const messages = useChatStore(
    (s) => s.threads[conversationId]?.messages ?? NO_MESSAGES,
  );
  const threadTitle = useChatStore((s) => s.threads[conversationId]?.title);
  const listTitle = useConversationsStore(
    (s) => s.conversations.find((c) => c.id === conversationId)?.title,
  );
  const live = useChatStore((s) => s.live);
  const send = useChatStore((s) => s.send);
  const stop = useChatStore((s) => s.stop);

  const liveHere =
    live && (live.conversationId ?? NEW_CHAT_ID) === conversationId
      ? live
      : null;
  const title = listTitle ?? threadTitle ?? UNTITLED_CONVERSATION;

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
                    // No regenerate: the backend has no route for it yet.
                    <AssistantMessage message={message} />
                  )}
                </MessageScrollerItem>
              ))}
              {liveHere && (
                <MessageScrollerItem messageId="live">
                  <LiveAssistantMessage live={liveHere} />
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
          // One reply at a time, even if it belongs to another chat.
          isGenerating={Boolean(live)}
          onSend={(prompt) =>
            send({
              prompt,
              conversationId:
                conversationId === NEW_CHAT_ID ? null : conversationId,
            })
          }
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
