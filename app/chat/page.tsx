import type { Metadata } from "next";
import { ChatView } from "@/components/chat/chat-view";
import { MOCK_CHAT_TITLE, MOCK_MESSAGES } from "@/lib/chat/mock-conversation";

export const metadata: Metadata = {
  title: `${MOCK_CHAT_TITLE} — MATIAS`,
};

export default function ChatPage() {
  return <ChatView title={MOCK_CHAT_TITLE} initialMessages={MOCK_MESSAGES} />;
}
