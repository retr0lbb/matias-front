"use client";

import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { Composer } from "./composer";

/** Home composer: the first message opens the new chat immediately. */
export function HomeComposer() {
  const router = useRouter();
  const beginNewChat = useChatStore((s) => s.beginNewChat);
  const send = useChatStore((s) => s.send);
  const stop = useChatStore((s) => s.stop);
  const generating = useChatStore((s) => s.live !== null);

  return (
    <Composer
      isGenerating={generating}
      onStop={stop}
      onSend={(prompt) => {
        beginNewChat();
        // send() records the message and starts the stream synchronously,
        // so /chat/new already has something to show when it renders.
        void send({ prompt, conversationId: null });
        router.push("/chat/new");
      }}
    />
  );
}
