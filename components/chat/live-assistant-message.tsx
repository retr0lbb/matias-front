"use client";

import { Brain, FilePenLine, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useRevealedText } from "@/hooks/use-revealed-text";
import {
  documentDetail,
  documentFailedLabel,
  documentingLabel,
  TIER_LABELS,
} from "@/lib/chat/labels";
import { type LiveReply, useChatStore } from "@/stores/chat-store";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "../ui/attachment";
import { Message, MessageContent } from "../ui/message";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "../ui/trace";
import { DocumentCard } from "./document-card";
import { Markdown } from "./markdown";
import { ThinkingSimple } from "./thinking-simple";
import { ToolTrace } from "./tool-trace";

/** Entrance used by every piece that appears mid-reply. */
const appear =
  "animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none";

function stageLabel(live: LiveReply) {
  switch (live.stage) {
    case "sending":
      return "Enviando…";
    case "classifying":
      return "Entendendo o seu pedido…";
    case "retrieving":
      return "Consultando seus arquivos…";
    case "documenting":
      return live.documenting
        ? documentingLabel(
            live.documenting.action,
            live.documenting.documentType,
          )
        : "Preparando o documento…";
    case "generating":
      return "Escrevendo a resposta…";
  }
}

/** The assistant turn while it streams, following the generation state. */
export function LiveAssistantMessage({ live }: { live: LiveReply }) {
  const revealed = useRevealedText(live.text);
  const commit = useChatStore((s) => s.commit);
  const writing = live.text.length > 0;
  const thinking = live.thinking.length > 0;
  const toolRunning = live.tools.some((t) => t.status === "running");
  // One "what's happening" line until the answer starts. The thinking trace,
  // tool lines and the document card speak for themselves while active.
  const showStage =
    !live.ending &&
    !writing &&
    !toolRunning &&
    live.stage !== "documenting" &&
    !(thinking && live.stage === "generating");
  const model = live.generating;

  // The stream ended: once the text is fully revealed, hand it to the thread.
  useEffect(() => {
    if (live.ending && revealed.caughtUp) commit();
  }, [live.ending, revealed.caughtUp, commit]);

  return (
    <Message>
      <MessageContent className="gap-3">
        {showStage && (
          <div key={live.stage} className={appear}>
            <ThinkingSimple
              pending={{ startedAt: live.startedAt, phase: stageLabel(live) }}
            />
          </div>
        )}

        {thinking && <LiveThinking live={live} />}

        <ToolTrace tools={live.tools} className={appear} />

        {model?.downgradedFrom && (
          <ModelNotice>
            Usando o modelo {TIER_LABELS[model.model]}, porque a cota do{" "}
            {TIER_LABELS[model.downgradedFrom]} acabou neste ciclo.
          </ModelNotice>
        )}
        {model?.upgradedFrom && (
          <ModelNotice>
            Usando o modelo {TIER_LABELS[model.model]} para este documento.
          </ModelNotice>
        )}

        {(writing || live.documents.length > 0 || live.documenting) && (
          <div className="flex flex-col gap-2.5">
            {writing && (
              <Markdown
                text={revealed.text}
                streaming={!(live.ending && revealed.caughtUp)}
              />
            )}
            {live.documents.map((doc) => (
              <div
                key={doc.id}
                className="animate-in fade-in-0 zoom-in-95 duration-300 motion-reduce:animate-none"
              >
                <DocumentCard document={doc} detail={documentDetail(doc)} />
              </div>
            ))}
            {live.documenting && <DocumentSkeleton live={live} />}
          </div>
        )}

        {live.failedDocuments.map((type, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: append-only list
          <ModelNotice key={i}>{documentFailedLabel(type)}</ModelNotice>
        ))}
      </MessageContent>
    </Message>
  );
}

/** Live reasoning: open while thinking, collapses once the answer starts. */
function LiveThinking({ live }: { live: LiveReply }) {
  const endedAt = live.thinkingEndedAt;
  const done = endedAt !== null;
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (done) setOpen(false);
  }, [done]);

  const startedAt = live.thinkingStartedAt ?? live.startedAt;
  const seconds =
    endedAt === null
      ? null
      : Math.max(1, Math.round((endedAt - startedAt) / 1000));

  return (
    <Trace className={appear}>
      <TraceCollapsible open={open} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger className="-ml-1.5 px-1.5 py-1 text-ink-2 hover:bg-muted">
          <TraceLine
            status={done ? undefined : "running"}
            className="text-[13px] font-medium text-ink-2"
          >
            <TraceIcon>
              <Brain className="size-3.75" />
            </TraceIcon>
            <TraceTitle>
              {seconds === null
                ? "Pensando…"
                : `Pensou por ${seconds === 1 ? "1 segundo" : `${seconds} segundos`}`}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="border-input">
          <p className="max-h-60 overflow-y-auto text-[13px] leading-[1.6] whitespace-pre-wrap text-muted-foreground">
            {live.thinking}
          </p>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

/** Placeholder card while a document is generated; becomes the real card. */
function DocumentSkeleton({ live }: { live: LiveReply }) {
  const doc = live.documenting;
  if (!doc) return null;
  return (
    <Attachment
      aria-busy="true"
      className={`w-full max-w-110 gap-3 overflow-hidden rounded-[10px] border-dashed border-input px-3! py-2.5! ${appear}`}
    >
      <AttachmentMedia className="size-8.5 w-8.5 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none">
        <FilePenLine className="size-4.25" />
      </AttachmentMedia>
      <AttachmentContent className="flex min-w-0 flex-1 flex-col gap-1.5">
        <AttachmentTitle className="shimmer text-sm motion-reduce:shimmer-none">
          {documentingLabel(doc.action, doc.documentType)}
        </AttachmentTitle>
        <AttachmentDescription className="mt-0">
          <span className="relative block h-1 w-full max-w-56 overflow-hidden rounded-full bg-secondary">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-[doc-progress_1.4s_ease-in-out_infinite] rounded-full bg-brand/60 motion-reduce:hidden" />
          </span>
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}

function ModelNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      className={`flex items-center gap-2 text-[13px] text-muted-foreground italic ${appear}`}
    >
      <Info className="size-3.5 shrink-0 not-italic" />
      <span>{children}</span>
    </p>
  );
}
