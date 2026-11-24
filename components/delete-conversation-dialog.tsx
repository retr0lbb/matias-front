"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { UNTITLED_CONVERSATION } from "@/lib/api/conversations";
import { deleteChat, forgetChat } from "@/lib/chat/conversation-actions";
import { useChatStore } from "@/stores/chat-store";
import { useConversationsStore } from "@/stores/conversations-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Checkbox } from "./ui/checkbox";

/** Confirms deleting a chat. Opened from the sidebar or the chat header. */
export function DeleteConversationDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const deletingId = useConversationsStore((s) => s.deletingId);
  const setDeletingId = useConversationsStore((s) => s.setDeletingId);
  const title = useConversationsStore(
    (s) => s.conversations.find((c) => c.id === deletingId)?.title ?? undefined,
  );
  const threadTitle = useChatStore((s) =>
    deletingId ? s.threads[deletingId]?.title : undefined,
  );
  const [withDocuments, setWithDocuments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkboxId = useId();
  /** A deleted chat that was open; its messages go once we've left it. */
  const leaving = useRef<string | null>(null);

  // Each confirmation starts clean, with documents kept.
  useEffect(() => {
    if (!deletingId) return;
    setWithDocuments(false);
    setError(null);
  }, [deletingId]);

  useEffect(() => {
    const id = leaving.current;
    if (id && pathname !== `/chat/${id}`) {
      leaving.current = null;
      forgetChat(id);
    }
  }, [pathname]);

  async function confirm() {
    if (!deletingId) return;
    const id = deletingId;
    setBusy(true);
    setError(null);
    try {
      await deleteChat(id, withDocuments);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
      return;
    }
    setBusy(false);
    setDeletingId(null);
    if (pathname === `/chat/${id}`) {
      // Dropping the messages now would flash a reload of the chat being
      // left, so wait for the navigation (see the effect above).
      leaving.current = id;
      router.replace("/chat");
    } else {
      forgetChat(id);
    }
  }

  const name = title ?? threadTitle ?? UNTITLED_CONVERSATION;

  return (
    <AlertDialog
      open={deletingId !== null}
      onOpenChange={(open) => {
        if (!open && !busy) setDeletingId(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
          <AlertDialogDescription>
            A conversa{" "}
            <span className="font-medium text-foreground">{name}</span> será
            excluída permanentemente. Isso não pode ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          <label
            htmlFor={checkboxId}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm has-data-checked:border-destructive/40 has-data-checked:bg-destructive/5"
          >
            <Checkbox
              id={checkboxId}
              checked={withDocuments}
              onCheckedChange={(checked) => setWithDocuments(checked)}
              disabled={busy}
              className="mt-0.5 data-checked:border-destructive data-checked:bg-destructive"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">
                Excluir também os documentos gerados
              </span>
              <span className="text-xs text-muted-foreground">
                Avaliações, planos de aula e outros materiais criados nesta
                conversa. Sem marcar, eles continuam salvos.
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={confirm}
            disabled={busy}
            className="gap-2"
          >
            {busy && (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {busy ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
