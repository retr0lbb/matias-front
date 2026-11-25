"use client";

import {
  ArrowUp,
  CircleAlert,
  FileText,
  Paperclip,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Upload, useUploads } from "@/hooks/use-uploads";
import { RAG_ACCEPT } from "@/lib/api/rag";
import type { ChatAttachment } from "@/lib/chat/types";
import { formatBytes } from "@/lib/usage-format";
import { cn } from "@/lib/utils";
import { ModelPicker } from "./model-picker";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "./ui/attachment";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

function toAttachment(upload: Upload): ChatAttachment {
  const ext = upload.name.split(".").pop()?.toUpperCase() ?? "Arquivo";
  return { name: upload.name, meta: `${ext} · ${formatBytes(upload.size)}` };
}

/** Past this, processing gets a "big files take a while" note. */
const SLOW_PROCESSING_MS = 15_000;

export type ComposerSend = {
  text: string;
  /** Files ready to be searched, for the user message. */
  attachments: ChatAttachment[];
  /** New chat with files: create it with this id (where they were sent). */
  newConversationId: string | null;
};

type ComposerProps = {
  /** "home": large, hero composer. "thread": docked under a conversation. */
  variant?: "home" | "thread";
  placeholder?: string;
  /** While true the send button becomes a stop button. */
  isGenerating?: boolean;
  /** The chat files are uploaded into; `null` for a chat not started yet. */
  conversationId?: string | null;
  onSend?: (message: ComposerSend) => void;
  onStop?: () => void;
  /**
   * Starting text. The field gets focus with the first "[placeholder]"
   * selected, so typing replaces it.
   */
  initialMessage?: string;
  className?: string;
};

export function Composer({
  variant = "home",
  placeholder = "Peça um plano de aula, uma prova, uma rubrica…",
  isGenerating = false,
  conversationId = null,
  onSend,
  onStop,
  initialMessage,
  className,
}: ComposerProps) {
  const files = useUploads(conversationId);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState(initialMessage ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Only the text it mounted with: later changes come from typing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useEffect(() => {
    const field = textareaRef.current;
    if (!initialMessage || !field) return;
    field.focus();
    const start = initialMessage.indexOf("[");
    const end = start === -1 ? -1 : initialMessage.indexOf("]", start);
    if (end !== -1) field.setSelectionRange(start, end + 1);
    else field.setSelectionRange(initialMessage.length, initialMessage.length);
  }, []);
  const isHome = variant === "home";

  const canSend = Boolean(message.trim()) && !files.pending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = message.trim();
    if (!text || isGenerating || files.pending) return;
    onSend?.({
      text,
      attachments: files.ready.map(toAttachment),
      newConversationId:
        files.ready.length > 0 ? files.draftConversationId() : null,
    });
    setMessage("");
    files.clear();
  }

  function onDrag(e: DragEvent<HTMLFormElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    if (e.type === "dragleave") {
      // Moving onto a child element isn't leaving the composer.
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setDragging(false);
      }
    } else {
      setDragging(true);
    }
  }

  function onDrop(e: DragEvent<HTMLFormElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setDragging(false);
    files.add(Array.from(e.dataTransfer.files));
  }

  return (
    <form
      onSubmit={handleSubmit}
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onDrag}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border border-input bg-surface px-3 pt-3.5 pb-2.5 md:gap-3.5 md:px-3.5 md:pt-4 md:pb-3 transition-shadow focus-within:shadow-[0_4px_16px_#1c1a170f]",
        isHome && "md:pt-4.5",
        className,
      )}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-brand/50 bg-surface/95 text-sm">
          <UploadIcon className="size-5 text-brand" />
          <span className="font-medium">Solte para anexar</span>
          <span className="text-xs text-ink-3">PDF ou DOCX</span>
        </div>
      )}

      {files.uploads.length > 0 && (
        <AttachmentGroup className="py-0">
          {files.uploads.map((upload) => (
            <UploadChip
              key={upload.key}
              upload={upload}
              onRemove={() => files.remove(upload.key)}
            />
          ))}
        </AttachmentGroup>
      )}

      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label="Mensagem"
        className={cn(
          "max-h-50 min-h-6 resize-none rounded-none border-0 bg-transparent p-0 shadow-none placeholder:text-ink-3 focus-visible:ring-0 dark:bg-transparent",
          isHome ? "text-base md:text-base" : "text-base md:text-[15px]",
        )}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={RAG_ACCEPT}
            className="hidden"
            onChange={(e) => {
              files.add(Array.from(e.target.files ?? []));
              // Picking the same file again should work too.
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Anexar PDF ou DOCX"
            title="Anexar PDF ou DOCX"
            onClick={() => inputRef.current?.click()}
            className="size-8.5 rounded-[9px] bg-transparent text-ink-2 shadow-none"
          >
            <Paperclip className="size-4.25" />
          </Button>
          <ModelPicker side={isHome ? "bottom" : "top"} />
        </div>

        <div className="flex items-center gap-2.5">
          {files.pending ? (
            <span className="text-xs text-ink-3">Aguardando os arquivos…</span>
          ) : (
            isHome && (
              <span className="hidden text-xs text-ink-3 sm:inline">
                Enter para enviar
              </span>
            )
          )}
          {isGenerating ? (
            <Button
              type="button"
              size="icon"
              aria-label="Parar resposta"
              title="Parar resposta"
              onClick={onStop}
              className="rounded-full"
            >
              <span className="size-2.75 rounded-[2px] bg-primary-foreground" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label={
                files.pending ? "Enviar (aguardando os arquivos)" : "Enviar"
              }
              disabled={!canSend}
              className="rounded-full bg-brand text-white hover:bg-brand/85 disabled:opacity-100"
            >
              <ArrowUp className="size-4.5" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function UploadChip({
  upload,
  onRemove,
}: {
  upload: Upload;
  onRemove: () => void;
}) {
  const now = useNow(upload.state === "processing");
  const slow =
    upload.state === "processing" &&
    upload.processingSince !== null &&
    now - upload.processingSince > SLOW_PROCESSING_MS;

  const description =
    upload.state === "uploading"
      ? `Enviando… ${Math.round(upload.progress * 100)}%`
      : upload.state === "processing"
        ? slow
          ? "Processando… arquivos grandes podem levar alguns minutos"
          : "Processando…"
        : upload.state === "ready"
          ? `${formatBytes(upload.size)} · pronto para consulta`
          : (upload.error ?? "Falhou");

  return (
    <Attachment
      size="sm"
      state={
        upload.state === "failed"
          ? "error"
          : upload.state === "ready"
            ? "done"
            : upload.state
      }
      className="max-w-full bg-background sm:max-w-80"
    >
      <AttachmentMedia className="bg-brand-tint text-brand">
        {upload.state === "uploading" || upload.state === "processing" ? (
          <span className="size-4 animate-spin rounded-full border-2 border-brand/25 border-t-brand motion-reduce:animate-none" />
        ) : upload.state === "failed" ? (
          <CircleAlert />
        ) : (
          <FileText />
        )}
      </AttachmentMedia>
      <AttachmentContent className="min-w-0">
        <AttachmentTitle className="text-[13px]">{upload.name}</AttachmentTitle>
        <AttachmentDescription title={description} className="text-ink-3">
          {description}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          aria-label={`Remover ${upload.name}`}
          onClick={onRemove}
          className="text-ink-3"
        >
          <X />
        </AttachmentAction>
      </AttachmentActions>
      {upload.state === "uploading" && (
        <span
          aria-hidden="true"
          className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full bg-brand/15"
        >
          <span
            className="block h-full bg-brand transition-[width] duration-200"
            style={{ width: `${upload.progress * 100}%` }}
          />
        </span>
      )}
    </Attachment>
  );
}

/** Re-renders every few seconds while `active`, for elapsed-time labels. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}
