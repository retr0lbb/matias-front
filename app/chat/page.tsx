import { ChatInput } from "@/components/chat-input";

export default function ChatPage() {
  return (
    <div className="flex w-full h-full">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-2xl">Olá, Como posso te ajudar?</p>
        <ChatInput />
      </div>
    </div>
  );
}
