"use client";

import { FilePenLine } from "lucide-react";
import {
  type PanelDocument,
  useDocumentPanelStore,
} from "@/stores/document-panel-store";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "../ui/attachment";

/** A document produced by the assistant; opens it in the side panel. */
export function DocumentCard({
  document,
  detail,
}: {
  document: PanelDocument;
  detail: string;
}) {
  const open = useDocumentPanelStore((s) => s.document?.id === document.id);
  const openDocument = useDocumentPanelStore((s) => s.open);

  return (
    <Attachment
      data-open={open || undefined}
      className="w-full max-w-110 gap-3 rounded-[10px] border-input px-3! py-2.5! transition-colors hover:bg-muted/60 data-open:border-ring/40 data-open:bg-muted/60"
    >
      <AttachmentMedia className="size-8.5 w-8.5 rounded-lg bg-secondary">
        <FilePenLine className="size-4.25" />
      </AttachmentMedia>
      <AttachmentContent className="flex min-w-0 flex-col gap-0.5">
        <AttachmentTitle className="truncate text-sm">
          {document.title}
        </AttachmentTitle>
        <AttachmentDescription className="mt-0">{detail}</AttachmentDescription>
      </AttachmentContent>
      {open && (
        <span className="flex h-5.5 shrink-0 items-center rounded-full bg-secondary px-2 text-xs font-medium">
          Aberto
        </span>
      )}
      <AttachmentTrigger
        aria-label={`Abrir ${document.title}`}
        aria-pressed={open}
        onClick={() => openDocument(document)}
        className="cursor-pointer rounded-[10px] focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </Attachment>
  );
}
