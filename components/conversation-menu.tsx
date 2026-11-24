"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useConversationsStore } from "@/stores/conversations-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/** Rename / delete actions for a chat, from the sidebar or the header. */
export function ConversationMenu({
  conversationId,
  from,
  trigger,
  align = "start",
  onOpenChange,
}: {
  conversationId: string;
  /** Where the inline rename field should appear. */
  from: "sidebar" | "header";
  trigger: ReactElement;
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
}) {
  const setRenaming = useConversationsStore((s) => s.setRenaming);
  const setDeletingId = useConversationsStore((s) => s.setDeletingId);

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        // After "Renomear" the focus belongs in the new field, not back on
        // the trigger (that would blur the field and save it right away).
        finalFocus={() => useConversationsStore.getState().renaming === null}
        className="w-48 rounded-xl p-1.5 shadow-[0_12px_32px_#1c1a1726] ring-border"
      >
        <DropdownMenuItem
          onClick={() => setRenaming({ id: conversationId, from })}
          className="h-9 gap-2.5 rounded-lg px-2.5"
        >
          <Pencil className="text-ink-2" />
          Renomear
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-1" />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setDeletingId(conversationId)}
          className="h-9 gap-2.5 rounded-lg px-2.5"
        >
          <Trash2 />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
