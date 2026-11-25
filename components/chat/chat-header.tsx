"use client";

import { Check, ChevronDown, Ellipsis, Share } from "lucide-react";
import { useState } from "react";
import { renameChat } from "@/lib/chat/conversation-actions";
import { useConversationsStore } from "@/stores/conversations-store";
import { ConversationMenu } from "../conversation-menu";
import { RenameInput } from "../rename-input";
import { Button } from "../ui/button";

export function ChatHeader({
  title,
  conversationId,
}: {
  title: string;
  /** Saved chat the menu acts on; without one the title is plain text. */
  conversationId?: string;
}) {
  const [shared, setShared] = useState(false);
  const renaming = useConversationsStore((s) =>
    conversationId &&
    s.renaming?.id === conversationId &&
    s.renaming.from === "header"
      ? s.renaming
      : null,
  );
  const setRenaming = useConversationsStore((s) => s.setRenaming);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard unavailable; nothing to do for now.
    }
  }

  return (
    <header className="flex h-12.5 shrink-0 items-center justify-between gap-2 pr-2 pl-13 md:gap-3 md:pr-4 md:pl-6">
      {conversationId && renaming ? (
        <div className="-ml-1.5 w-full max-w-90 pt-0.5">
          <RenameInput
            initial={renaming.draft ?? title}
            error={renaming.error}
            onSubmit={(next) => renameChat(conversationId, next, "header")}
            onCancel={() => setRenaming(null)}
            className="h-8 text-[15px] font-medium"
          />
        </div>
      ) : conversationId ? (
        <ConversationMenu
          conversationId={conversationId}
          from="header"
          trigger={
            <button
              type="button"
              className="-ml-1.5 flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[15px] font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
            >
              <span className="truncate">{title}</span>
              <ChevronDown className="size-3.5 shrink-0 text-ink-3" />
            </button>
          }
        />
      ) : (
        <h1 className="truncate text-[15px] font-medium">{title}</h1>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          onClick={share}
          aria-label={shared ? "Link copiado" : "Compartilhar"}
          className="h-8 gap-2 rounded-lg px-2 text-[13px] text-ink-2 md:px-2.5"
        >
          {shared ? <Check className="size-4" /> : <Share className="size-4" />}
          <span className="hidden sm:inline">
            {shared ? "Link copiado" : "Compartilhar"}
          </span>
        </Button>
        {conversationId && (
          <ConversationMenu
            conversationId={conversationId}
            from="header"
            align="end"
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mais opções"
                title="Mais opções"
                className="text-ink-2"
              >
                <Ellipsis className="size-4.25" />
              </Button>
            }
          />
        )}
      </div>
    </header>
  );
}
