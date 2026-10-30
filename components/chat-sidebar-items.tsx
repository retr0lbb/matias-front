import { Ellipsis } from "lucide-react";
import { tv } from "tailwind-variants";

interface ChatSideBarItemsProps {
  text: string;
}

const chatSidebarVariants = tv({
  base: "flex items-center justify-between text-zinc-600 cursor-pointer p-0.5 text-xs",
});

const iconSidebarVariants = tv({
  base: "",
});

export function ChatSideBarItems(props: ChatSideBarItemsProps) {
  return (
    <div
      className="flex items-center justify-between gap-2 text-zinc-600 
    cursor-pointer p-0.5 text-sm group hover:text-zinc-800 hover:bg-zinc-300 transition-all rounded
    whitespace-nowrap
    "
    >
      <p className="max-w-max overflow-hidden">{props.text}</p>
      <Ellipsis
        strokeWidth={1}
        className="opacity-0 shrink-0 group-hover:opacity-100"
      />
    </div>
  );
}
