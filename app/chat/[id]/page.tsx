import type { Metadata } from "next";
import { Suspense } from "react";
import { ConversationView } from "@/components/chat/conversation-view";

export const metadata: Metadata = {
  title: "Conversa — MATIAS",
};

// The id is only known at request time, so it's read below a Suspense boundary.
export default function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  return (
    <Suspense>
      <ConversationView params={params} />
    </Suspense>
  );
}
