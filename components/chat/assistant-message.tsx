import type {
  AssistantMessage as AssistantMessageType,
  PendingReply,
} from "@/lib/chat/types";
import { Message, MessageContent } from "../ui/message";
import { AnswerBlock, blocksToText } from "./answer-blocks";
import { MessageActions } from "./message-actions";
import { ThinkingDetailed } from "./thinking-detailed";
import { ThinkingSimple } from "./thinking-simple";

export function AssistantMessage({
  message,
  onRegenerate,
}: {
  message: AssistantMessageType;
  onRegenerate?: () => void;
}) {
  const hasList = message.blocks.some((b) => b.type === "numbered-list");
  const isNotice = message.blocks.every((b) => b.type === "notice");

  return (
    <Message>
      <MessageContent className="gap-3">
        {message.thinking && <ThinkingDetailed thinking={message.thinking} />}
        <div className="flex flex-col gap-2.5">
          {message.blocks.map((block, i) => (
            // Blocks are static per message, so the index is a stable key.
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <AnswerBlock key={i} block={block} />
          ))}
        </div>
        {!isNotice && (
          <MessageActions
            copyText={blocksToText(message.blocks)}
            onRegenerate={onRegenerate}
            // Placeholder until the document panel exists.
            onOpenAsDocument={hasList ? () => {} : undefined}
          />
        )}
      </MessageContent>
    </Message>
  );
}

/** Assistant turn that is still being generated. */
export function PendingAssistantMessage({
  pending,
}: {
  pending: PendingReply;
}) {
  return (
    <Message>
      <MessageContent>
        <ThinkingSimple pending={pending} />
      </MessageContent>
    </Message>
  );
}
