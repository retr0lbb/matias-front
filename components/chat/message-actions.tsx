"use client";

import {
  Check,
  Copy,
  FilePenLine,
  type LucideIcon,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

function ActionButton({
  label,
  icon: Icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "size-7.5 rounded-lg text-muted-foreground hover:bg-muted",
        active && "text-foreground",
      )}
    >
      <Icon className={cn("size-3.75", active && "fill-current/15")} />
    </Button>
  );
}

type Feedback = "up" | "down" | null;

export function MessageActions({
  copyText,
  onRegenerate,
  onOpenAsDocument,
}: {
  copyText: string;
  onRegenerate?: () => void;
  onOpenAsDocument?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); ignore.
    }
  }

  return (
    <div className="-ml-1.5 flex items-center gap-0.5">
      <ActionButton
        label={copied ? "Copiado" : "Copiar"}
        icon={copied ? Check : Copy}
        onClick={copy}
      />
      {onOpenAsDocument && (
        <ActionButton
          label="Abrir como documento"
          icon={FilePenLine}
          onClick={onOpenAsDocument}
        />
      )}
      {onRegenerate && (
        <ActionButton
          label="Gerar de novo"
          icon={RefreshCw}
          onClick={onRegenerate}
        />
      )}
      <ActionButton
        label="Gostei"
        icon={ThumbsUp}
        active={feedback === "up"}
        onClick={() => setFeedback((f) => (f === "up" ? null : "up"))}
      />
      <ActionButton
        label="Não gostei"
        icon={ThumbsDown}
        active={feedback === "down"}
        onClick={() => setFeedback((f) => (f === "down" ? null : "down"))}
      />
    </div>
  );
}
