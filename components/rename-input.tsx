"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { TITLE_MAX_LENGTH } from "@/lib/chat/conversation-actions";

/**
 * Inline title editor. Enter or clicking away saves, Esc cancels. Starts
 * focused with the text selected, so typing replaces the old title.
 */
export function RenameInput({
  initial,
  error,
  onSubmit,
  onCancel,
  className,
}: {
  initial: string;
  /** Shown under the field when the last save failed. */
  error?: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  // Esc also blurs the field; this stops the blur from saving afterwards.
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function finish(save: boolean) {
    if (done.current) return;
    done.current = true;
    if (save) onSubmit(value);
    else onCancel();
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <input
        ref={ref}
        value={value}
        maxLength={TITLE_MAX_LENGTH}
        aria-label="Nome da conversa"
        aria-invalid={error ? true : undefined}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          }
        }}
        className={cn(
          "h-8.5 w-full min-w-0 rounded-lg border border-ring/40 bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
      />
      {error && (
        <p role="alert" className="px-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
