"use client";

import { ArrowUp, FileText, Paperclip, Wrench, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import type { ChatAttachment } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { ModelPicker } from "./model-picker";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "./ui/attachment";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function fileToAttachment(file: File): ChatAttachment {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "Arquivo";
  const kb = file.size / 1024;
  const size =
    kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.ceil(kb)} KB`;
  return { name: file.name, meta: `${ext} · ${size}` };
}

type ComposerProps = {
  /** "home": large, hero composer. "thread": docked under a conversation. */
  variant?: "home" | "thread";
  placeholder?: string;
  /** While true the send button becomes a stop button. */
  isGenerating?: boolean;
  onSend?: (text: string, attachments: ChatAttachment[]) => void;
  onStop?: () => void;
  className?: string;
};

export function Composer({
  variant = "home",
  placeholder = "Peça um plano de aula, uma prova, uma rubrica…",
  isGenerating = false,
  onSend,
  onStop,
  className,
}: ComposerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isHome = variant === "home";

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = message.trim();
    if (!text || isGenerating) return;
    onSend?.(text, file ? [fileToAttachment(file)] : []);
    setMessage("");
    clearFile();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-3.5 rounded-2xl border border-input bg-surface px-3.5 pt-4 pb-3 transition-shadow focus-within:shadow-[0_4px_16px_#1c1a170f]",
        isHome && "pt-4.5",
        className,
      )}
    >
      {file && (
        <Attachment size="sm" className="bg-background">
          <AttachmentMedia className="bg-brand-tint text-brand">
            <FileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle className="text-[13px]">
              {file.name}
            </AttachmentTitle>
            <AttachmentDescription className="text-ink-3">
              {fileToAttachment(file).meta} · pronto para consulta
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label="Remover arquivo"
              onClick={clearFile}
              className="text-ink-3"
            >
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}

      <Textarea
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
          isHome ? "text-base md:text-base" : "text-[15px] md:text-[15px]",
        )}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {/* Uploads (POST /rag/documents) aren't wired yet. */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled
            aria-label="Anexar arquivo (em breve)"
            title="Anexar arquivo — em breve"
            onClick={() => inputRef.current?.click()}
            className="size-8.5 rounded-[9px] bg-transparent text-ink-2 shadow-none"
          >
            <Paperclip className="size-4.25" />
          </Button>
          {isHome ? (
            <Button
              type="button"
              variant="outline"
              className="h-8.5 gap-1.75 rounded-[9px] bg-transparent px-2.5 text-[13px] font-normal text-ink-2 shadow-none"
            >
              <Wrench className="size-3.75" />
              Ferramentas
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Ferramentas"
              title="Ferramentas"
              className="size-8.5 rounded-[9px] bg-transparent text-ink-2 shadow-none"
            >
              <Wrench className="size-4.25" />
            </Button>
          )}
          <ModelPicker side={isHome ? "bottom" : "top"} />
        </div>

        <div className="flex items-center gap-2.5">
          {isHome && (
            <span className="text-xs text-ink-3">Enter para enviar</span>
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
              aria-label="Enviar"
              disabled={!message.trim()}
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
