"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NEW_CHAT_ID, useChatStore } from "@/stores/chat-store";
import { ChatView } from "./chat-view";

/**
 * A chat whose first message was just sent from home. It renders right away
 * (no waiting for the backend); when `start` brings the id, the URL becomes
 * /chat/<id> in place, without remounting anything.
 */
export function NewChatView() {
  const router = useRouter();
  const hasDraft = useChatStore((s) => NEW_CHAT_ID in s.threads);
  const startedId = useChatStore((s) => s.startedConversationId);
  const conversationId = hasDraft ? NEW_CHAT_ID : startedId;

  useEffect(() => {
    if (!hasDraft && startedId) {
      // Next keeps usePathname (and the sidebar highlight) in sync with this.
      window.history.replaceState(null, "", `/chat/${startedId}`);
    }
  }, [hasDraft, startedId]);

  useEffect(() => {
    // Opened directly (e.g. a reload): there's nothing to show here.
    if (!conversationId) router.replace("/");
  }, [conversationId, router]);

  if (!conversationId) return null;
  return <ChatView conversationId={conversationId} />;
}
