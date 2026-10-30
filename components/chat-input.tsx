import { ArrowUp, Paperclip } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function ChatInput() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm transition-all focus-within:border-primary/50 focus-within:shadow-md">
        <Textarea
          placeholder="O que você gostaria de criar hoje?"
          className="min-h-15 max-h-50 w-full resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <div className="flex items-center justify-between">
          {/* Anexar arquivo */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Enviar */}
          <Button type="submit" size="icon" className="rounded-xl">
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
