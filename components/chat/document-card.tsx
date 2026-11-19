import { FilePenLine } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "../ui/attachment";

/** A document produced by the assistant (opens in the document panel later). */
export function DocumentCard({
  title,
  detail,
  open = false,
  onOpen,
}: {
  title: string;
  detail: string;
  open?: boolean;
  onOpen?: () => void;
}) {
  return (
    <Attachment className="w-full max-w-110 gap-3 rounded-[10px] border-input px-3! py-2.5!">
      <AttachmentMedia className="size-8.5 w-8.5 rounded-lg bg-secondary">
        <FilePenLine className="size-4.25" />
      </AttachmentMedia>
      <AttachmentContent className="flex flex-col gap-0.5">
        <AttachmentTitle className="text-sm">{title}</AttachmentTitle>
        <AttachmentDescription className="mt-0">{detail}</AttachmentDescription>
      </AttachmentContent>
      {open && (
        <span className="flex h-5.5 shrink-0 items-center rounded-full bg-secondary px-2 text-xs font-medium">
          Aberto
        </span>
      )}
      <AttachmentTrigger
        aria-label={`Abrir ${title}`}
        onClick={onOpen}
        className="cursor-pointer rounded-[10px] focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </Attachment>
  );
}
