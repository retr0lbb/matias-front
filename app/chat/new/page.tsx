import type { Metadata } from "next";
import { NewChatView } from "@/components/chat/new-chat-view";

export const metadata: Metadata = {
  title: "Nova conversa — MATIAS",
};

export default function NewChatPage() {
  return <NewChatView />;
}
