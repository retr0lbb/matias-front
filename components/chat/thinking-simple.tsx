"use client";

import { useEffect, useState } from "react";
import type { PendingReply } from "@/lib/chat/types";
import { Trace, TraceDescription, TraceLine, TraceTitle } from "../ui/trace";

function ThinkingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-brand motion-reduce:animate-none"
    />
  );
}

/** Simple reasoning: live phase + elapsed time while the reply is pending. */
export function ThinkingSimple({ pending }: { pending: PendingReply }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - pending.startedAt) / 1000));

  return (
    <Trace role="status" aria-live="polite">
      <TraceLine status="running" className="gap-2.5 py-1.5">
        <ThinkingSpinner />
        <TraceTitle className="text-sm font-medium text-ink-2">
          {pending.phase}
        </TraceTitle>
        <TraceDescription className="text-[13px] text-muted-foreground">
          {elapsed} s
        </TraceDescription>
      </TraceLine>
    </Trace>
  );
}
