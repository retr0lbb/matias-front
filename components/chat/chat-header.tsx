"use client";

import {
  Check,
  ChevronDown,
  Ellipsis,
  Pencil,
  Pin,
  Share,
  Trash2,
} from "lucide-react";
import { type ReactElement, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/** Conversation actions, shared by the title and the "more" button. */
function ConversationMenu({
  trigger,
  align = "start",
}: {
  trigger: ReactElement;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className="w-52 rounded-xl p-1.5 shadow-[0_12px_32px_#1c1a1726] ring-border"
      >
        <DropdownMenuItem className="h-9 gap-2.5 rounded-lg px-2.5">
          <Pencil className="text-ink-2" />
          Renomear
        </DropdownMenuItem>
        <DropdownMenuItem className="h-9 gap-2.5 rounded-lg px-2.5">
          <Pin className="text-ink-2" />
          Fixar conversa
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-1" />
        <DropdownMenuItem
          variant="destructive"
          className="h-9 gap-2.5 rounded-lg px-2.5"
        >
          <Trash2 />
          Excluir conversa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatHeader({ title }: { title: string }) {
  const [shared, setShared] = useState(false);

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
    <header className="flex h-12.5 shrink-0 items-center justify-between pr-4 pl-6">
      <ConversationMenu
        trigger={
          <button
            type="button"
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 -ml-1.5 text-[15px] font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
          >
            <span className="truncate">{title}</span>
            <ChevronDown className="size-3.5 shrink-0 text-ink-3" />
          </button>
        }
      />

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          onClick={share}
          className="h-8 gap-2 rounded-lg px-2.5 text-[13px] text-ink-2"
        >
          {shared ? <Check className="size-4" /> : <Share className="size-4" />}
          {shared ? "Link copiado" : "Compartilhar"}
        </Button>
        <ConversationMenu
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
      </div>
    </header>
  );
}
