import { GitCompare, Info } from "lucide-react";
import type { AnswerBlock as AnswerBlockType } from "@/lib/chat/types";
import { DocumentCard } from "./document-card";

export function NumberedList({
  items,
}: {
  items: { title: string; detail: string }[];
}) {
  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={item.title} className="flex gap-3">
          <span className="w-4.5 shrink-0 font-serif text-[17px] text-brand">
            {i + 1}.
          </span>
          <div className="flex min-w-0 flex-col gap-0.75">
            <p className="text-[15px] font-semibold">{item.title}</p>
            <p className="text-[15px] leading-[1.6] text-[#3a3631] dark:text-ink-2">
              {item.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ChangeSummary({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <GitCompare className="size-3.5" />
      {label}
    </p>
  );
}

export function AnswerBlock({ block }: { block: AnswerBlockType }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-[15px] leading-[1.6] whitespace-pre-wrap">
          {block.text}
        </p>
      );
    case "numbered-list":
      return <NumberedList items={block.items} />;
    case "document":
      return (
        <DocumentCard
          title={block.title}
          detail={block.detail}
          open={block.open}
        />
      );
    case "change-summary":
      return <ChangeSummary label={block.label} />;
    case "notice":
      return (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground italic">
          <Info className="size-3.5 not-italic" />
          {block.text}
        </p>
      );
  }
}

/** Plain-text version of an answer, used by the copy action. */
export function blocksToText(blocks: AnswerBlockType[]) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph":
        case "notice":
          return b.text;
        case "numbered-list":
          return b.items
            .map((it, i) => `${i + 1}. ${it.title} — ${it.detail}`)
            .join("\n");
        case "document":
          return `${b.title} (${b.detail})`;
        case "change-summary":
          return b.label;
        default:
          return "";
      }
    })
    .join("\n\n");
}
