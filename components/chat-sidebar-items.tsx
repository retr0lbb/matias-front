import { Ellipsis, Heart } from "lucide-react";
import { tv } from "tailwind-variants";

interface ChatSideBarItemsProps {
  text: string;
  isSelected?: boolean;
  className?: string;
}

const chatSidebarVariants = tv({
  base: `flex items-center justify-between gap-2 text-zinc-600 
    cursor-pointer p-0.5 text-sm group hover:text-zinc-800 hover:bg-zinc-300 transition-all rounded
    whitespace-nowrap`,

  variants: {
    selected: {
      true: "bg-zinc-950/10 text-zinc-950 border border-zinc-950/5",
    },
  },
});

export function ChatSideBarItems(props: ChatSideBarItemsProps) {
  return (
    <div
      className={chatSidebarVariants({
        className: props.className,
        selected: props.isSelected,
      })}
    >
      <p className="max-w-max overflow-hidden">{props.text}</p>
      <div className="flex items-center justify-center gap-1 pr-2">
        <Heart
          strokeWidth={1}
          size={14}
          className="opacity-0 shrink-0 group-hover:opacity-100"
        />
        <Ellipsis
          strokeWidth={1}
          className="opacity-0 shrink-0 group-hover:opacity-100"
        />
      </div>
    </div>
  );
}
