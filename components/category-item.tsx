import { tv } from "tailwind-variants";

export interface CategoryItemProps {
  text: string;
  isSelected?: boolean;
  className?: string;
}

const categoryVariant = tv({
  base: "text-sm shrink-0 cursor-pointer text-zinc-600 border px-2 py-0.5 rounded-full border-zinc-900",
  variants: {
    isSelected: {
      true: "bg-zinc-800 border-zinc-800 text-zinc-200 font-semibold",
    },
  },
});

export function CategoryItem(props: CategoryItemProps) {
  return (
    <span
      className={categoryVariant({
        className: props.className,
        isSelected: props.isSelected,
      })}
    >
      {props.text}
    </span>
  );
}
