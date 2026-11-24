"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { tv } from "tailwind-variants";
import { renameChat } from "@/lib/chat/conversation-actions";
import { useConversationsStore } from "@/stores/conversations-store";
import { ConversationMenu } from "./conversation-menu";
import { RenameInput } from "./rename-input";

interface ChatSideBarItemsProps {
  id: string;
  text: string;
  href?: string;
  isSelected?: boolean;
  className?: string;
}

const chatSidebarVariants = tv({
  base: `group relative flex h-8.5 w-full shrink-0 items-center rounded-lg
    text-sm text-ink-2 transition-colors hover:bg-accent hover:text-foreground
    has-data-popup-open:bg-accent has-data-popup-open:text-foreground`,

  variants: {
    selected: {
      true: "bg-accent font-medium text-foreground",
    },
  },
});

export function ChatSideBarItems(props: ChatSideBarItemsProps) {
  const renaming = useConversationsStore((s) =>
    s.renaming?.id === props.id && s.renaming.from === "sidebar"
      ? s.renaming
      : null,
  );
  const setRenaming = useConversationsStore((s) => s.setRenaming);
  const [menuOpen, setMenuOpen] = useState(false);

  if (renaming) {
    return (
      <RenameInput
        initial={renaming.draft ?? props.text}
        error={renaming.error}
        onSubmit={(title) => renameChat(props.id, title, "sidebar")}
        onCancel={() => setRenaming(null)}
      />
    );
  }

  return (
    <div
      className={chatSidebarVariants({
        className: props.className,
        selected: props.isSelected,
      })}
    >
      <Link
        href={props.href ?? "/chat"}
        aria-current={props.isSelected ? "page" : undefined}
        onDoubleClick={() => setRenaming({ id: props.id, from: "sidebar" })}
        className="flex h-full min-w-0 flex-1 items-center rounded-lg pr-9 pl-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="truncate">{props.text}</span>
      </Link>
      <ConversationMenu
        conversationId={props.id}
        from="sidebar"
        onOpenChange={setMenuOpen}
        trigger={
          <button
            type="button"
            aria-label={`Opções de ${props.text}`}
            title="Opções"
            className={`absolute right-1 flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-3 outline-none transition-opacity hover:bg-background/70 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 group-hover:opacity-100 data-popup-open:bg-background/70 data-popup-open:text-foreground ${
              menuOpen ? "opacity-100" : "opacity-0"
            } pointer-coarse:opacity-100`}
          >
            <Ellipsis className="size-4" />
          </button>
        }
      />
    </div>
  );
}
