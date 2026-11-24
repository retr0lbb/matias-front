"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  getConversation,
  UNTITLED_CONVERSATION,
} from "@/lib/api/conversations";
import { toChatMessage } from "@/lib/chat/from-api";
import { useChatStore } from "@/stores/chat-store";
import { useConversationsStore } from "@/stores/conversations-store";
import { Button } from "../ui/button";
import { ChatHeader } from "./chat-header";
import { ChatView } from "./chat-view";

type State =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" };

/** One saved conversation, loaded from `GET /ai/chat/:id`. */
export function ConversationView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // Show the title from the sidebar while the messages load.
  const listTitle = useConversationsStore(
    (s) => s.conversations.find((c) => c.id === id)?.title,
  );
  // Already in the store when the chat was just created from home, or when
  // it was opened before in this session.
  const loaded = useChatStore((s) => id in s.threads);
  const setThread = useChatStore((s) => s.setThread);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // `attempt` only re-runs the fetch when the user clicks "Tentar de novo".
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
  useEffect(() => {
    if (useChatStore.getState().threads[id]) return;
    let cancelled = false;
    setState({ status: "loading" });
    getConversation(id).then(
      (conversation) => {
        if (cancelled) return;
        // A stream may have started this thread meanwhile; keep that one.
        if (useChatStore.getState().threads[id]) return;
        setThread(id, {
          title: conversation.title,
          messages: conversation.messages.map(toChatMessage),
        });
      },
      (error) => {
        if (cancelled) return;
        // A missing chat or someone else's is always 404; a malformed id is 400.
        const notFound =
          error instanceof ApiError &&
          (error.status === 404 || error.status === 400);
        setState({ status: notFound ? "not-found" : "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id, attempt, setThread]);

  if (loaded) return <ChatView key={id} conversationId={id} />;

  const title = listTitle ?? UNTITLED_CONVERSATION;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <ChatHeader title={state.status === "not-found" ? "" : title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        {state.status === "loading" && (
          <LoaderCircle
            aria-label="Carregando conversa"
            className="size-5 animate-spin text-ink-3"
          />
        )}
        {state.status === "not-found" && (
          <>
            <p className="font-serif text-2xl">Conversa não encontrada</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ela pode ter sido apagada, ou o link está errado.
            </p>
            <Button nativeButton={false} render={<Link href="/" />}>
              Nova conversa
            </Button>
          </>
        )}
        {state.status === "error" && (
          <>
            <CircleAlert className="size-5 text-destructive" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Não foi possível carregar esta conversa.
            </p>
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              Tentar de novo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
