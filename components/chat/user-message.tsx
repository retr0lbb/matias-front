import { FileText } from "lucide-react";
import type { UserMessage as UserMessageType } from "@/lib/chat/types";
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "../ui/attachment";
import { Message, MessageContent } from "../ui/message";

export function UserMessage({ message }: { message: UserMessageType }) {
  return (
    <Message align="end">
      <MessageContent className="items-end gap-2">
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentGroup className="justify-end py-0">
            {message.attachments.map((file) => (
              <Attachment
                key={file.name}
                size="xs"
                title={file.meta}
                className="min-w-0 rounded-lg"
              >
                <AttachmentMedia className="bg-brand-tint text-brand">
                  <FileText />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                </AttachmentContent>
              </Attachment>
            ))}
          </AttachmentGroup>
        )}
        <div className="max-w-[min(480px,85%)] rounded-2xl bg-secondary px-4 py-3 text-[15px] leading-normal whitespace-pre-wrap">
          {message.text}
        </div>
      </MessageContent>
    </Message>
  );
}
