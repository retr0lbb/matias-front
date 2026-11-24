import { Check, GraduationCap, X } from "lucide-react";
import { toolLabel } from "@/lib/chat/tool-labels";
import { cn } from "@/lib/utils";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "../ui/trace";

export type ToolStep = {
  name: string;
  status: "running" | "done" | "error";
};

/** The Classroom tools a reply used, one line per call. */
export function ToolTrace({
  tools,
  className,
}: {
  tools: ToolStep[];
  className?: string;
}) {
  if (tools.length === 0) return null;
  return (
    <Trace className={className}>
      {tools.map((tool, i) => (
        // Calls only get appended, so the index is stable.
        // biome-ignore lint/suspicious/noArrayIndexKey: append-only list
        <ToolLine key={i} tool={tool} />
      ))}
    </Trace>
  );
}

function ToolLine({ tool }: { tool: ToolStep }) {
  const running = tool.status === "running";
  const failed = tool.status === "error";
  return (
    <TraceLine
      status={running ? "running" : failed ? "error" : undefined}
      className="text-[13px]"
    >
      <TraceIcon>
        {running ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-border border-t-brand motion-reduce:animate-none" />
        ) : failed ? (
          <X className="size-3.75" />
        ) : (
          <Check className="size-3.75 text-success" />
        )}
      </TraceIcon>
      <GraduationCap
        className={cn("size-3.75 shrink-0", !failed && "text-ink-2")}
        aria-hidden="true"
      />
      <TraceTitle className="font-medium">
        {toolLabel(tool.name, tool.status)}
      </TraceTitle>
    </TraceLine>
  );
}
