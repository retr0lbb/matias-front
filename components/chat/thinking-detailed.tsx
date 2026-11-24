"use client";

import { Brain } from "lucide-react";
import type { DetailedThinking } from "@/lib/chat/types";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "../ui/trace";

function formatDuration(seconds: number) {
  return seconds === 1 ? "1 segundo" : `${seconds} segundos`;
}

/** Advanced reasoning: collapsible trace of the steps behind an answer. */
export function ThinkingDetailed({
  thinking,
  defaultOpen = true,
}: {
  thinking: DetailedThinking;
  defaultOpen?: boolean;
}) {
  return (
    <Trace>
      <TraceCollapsible defaultOpen={defaultOpen}>
        <TraceCollapsibleTrigger className="-ml-1.5 px-1.5 py-1 text-ink-2 hover:bg-muted">
          <TraceLine className="text-[13px] font-medium text-ink-2">
            <TraceIcon>
              <Brain className="size-3.75" />
            </TraceIcon>
            <TraceTitle>
              {thinking.seconds === undefined
                ? "Raciocínio"
                : `Pensou por ${formatDuration(thinking.seconds)}`}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="flex flex-col gap-2.5 border-input">
          {thinking.steps.map((step, i) => (
            // Steps never reorder, so the index is a stable key.
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <div key={i} className="flex flex-col gap-1">
              {step.title && (
                <p className="text-[13px] font-semibold text-ink-2">
                  {step.title}
                </p>
              )}
              <p className="text-[13px] leading-[1.6] whitespace-pre-wrap text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
