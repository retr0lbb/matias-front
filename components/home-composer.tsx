"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useUiStore } from "@/stores/ui-store";
import { Composer } from "./composer";

/** Home composer: the first message opens the new chat immediately. */
export function HomeComposer() {
  const router = useRouter();
  const beginNewChat = useChatStore((s) => s.beginNewChat);
  const send = useChatStore((s) => s.send);
  const stop = useChatStore((s) => s.stop);
  const generating = useChatStore((s) => s.live !== null);
  // A prompt handed over by another page (e.g. Ferramentas), taken once.
  const [draft] = useState(() => useUiStore.getState().composerDraft);
  useEffect(() => {
    useUiStore.getState().setComposerDraft(null);
  }, []);

  return (
    <Composer
      initialMessage={draft ?? undefined}
      isGenerating={generating}
      onStop={stop}
      onSend={({ text, attachments, newConversationId }) => {
        beginNewChat();
        // send() records the message and starts the stream synchronously,
        // so /chat/new already has something to show when it renders.
        void send({
          prompt: text,
          conversationId: null,
          attachments,
          newConversationId,
        });
        router.push("/chat/new");
      }}
    />
  );
}
