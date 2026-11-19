"use client";

import { ArrowUp, FileText, Paperclip, Wrench, X } from "lucide-react";
import { useRef, useState } from "react";
import { ModelPicker } from "./model-picker";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

function formatFileMeta(file: File) {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "Arquivo";
  const kb = file.size / 1024;
  const size =
    kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.ceil(kb)} KB`;
  return `${ext} · ${size} · pronto para consulta`;
}

export function HomeComposer() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-3.5 rounded-2xl border border-input bg-surface px-3.5 pt-4.5 pb-3 transition-shadow focus-within:shadow-[0_4px_16px_#1c1a170f]"
    >
      {file && (
        <div className="flex w-fit items-center gap-2.5 rounded-[10px] border bg-background py-2 pr-3 pl-2">
          <span className="flex size-8 items-center justify-center rounded-[7px] bg-brand-tint">
            <FileText className="size-4 text-brand" />
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-[13px] font-medium">{file.name}</span>
            <span className="text-xs text-ink-3">{formatFileMeta(file)}</span>
          </span>
          <button
            type="button"
            aria-label="Remover arquivo"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="ml-1 cursor-pointer rounded text-ink-3 hover:text-foreground"
          >
            <X className="size-3.75" />
          </button>
        </div>
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
        placeholder="Peça um plano de aula, uma prova, uma rubrica…"
        className="max-h-50 min-h-6 resize-none rounded-none border-0 bg-transparent p-0 text-base shadow-none placeholder:text-ink-3 focus-visible:ring-0 md:text-base dark:bg-transparent"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Anexar arquivo"
            onClick={() => inputRef.current?.click()}
            className="size-8.5 rounded-[9px] bg-transparent text-ink-2 shadow-none"
          >
            <Paperclip className="size-4.25" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8.5 gap-1.75 rounded-[9px] bg-transparent px-2.5 text-[13px] font-normal text-ink-2 shadow-none"
          >
            <Wrench className="size-3.75" />
            Ferramentas
          </Button>
          <ModelPicker />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-ink-3">Enter para enviar</span>
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar"
            disabled={!message.trim()}
            className="rounded-full bg-brand text-white hover:bg-brand/85 disabled:opacity-100"
          >
            <ArrowUp className="size-4.5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
