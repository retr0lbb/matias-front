import { Ellipsis } from "lucide-react";
import { tv } from "tailwind-variants";

interface ChatSideBarItemsProps {
  text: string;
  isSelected?: boolean;
  className?: string;
}

const chatSidebarVariants = tv({
  base: `group flex h-8.5 w-full shrink-0 cursor-pointer items-center justify-between gap-2
    rounded-lg px-2.5 text-sm text-ink-2 transition-colors hover:bg-accent hover:text-foreground`,

  variants: {
    selected: {
      true: "bg-accent font-medium text-foreground",
    },
  },
});

export function ChatSideBarItems(props: ChatSideBarItemsProps) {
  return (
    <button
      type="button"
      className={chatSidebarVariants({
        className: props.className,
        selected: props.isSelected,
      })}
    >
      <span className="truncate">{props.text}</span>
      <Ellipsis className="size-4 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
