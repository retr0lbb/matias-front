"use client";

import { cn } from "cn";
import { Check, Copy } from "lucide-react";
import { type ComponentProps, memo, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { hideOpenMath, normalizeMath } from "@/lib/chat/math";

// Single `$` is off: in pt-BR it's money. `normalizeMath` handles `$x$`.
const remarkPlugins = [
  remarkGfm,
  [remarkMath, { singleDollarTextMath: false }],
] satisfies NonNullable<ComponentProps<typeof ReactMarkdown>["remarkPlugins"]>;
const rehypePlugins = [
  [
    rehypeKatex,
    {
      // A bad formula renders as its source instead of breaking the reply.
      throwOnError: false,
      errorColor: "var(--muted-foreground)",
      // Models often put accented words in \text{}; don't warn about it.
      strict: "ignore",
    },
  ],
] satisfies NonNullable<ComponentProps<typeof ReactMarkdown>["rehypePlugins"]>;

/**
 * Closes inline markers a stream left open mid-token (`**bol`, `` `cod``),
 * so the partial reply renders as formatted text instead of raw symbols.
 * Unclosed code fences already render as a code block, so they're left alone.
 */
export function repairPartialMarkdown(text: string) {
  const fences = text.match(/^\s*(```|~~~)/gm)?.length ?? 0;
  if (fences % 2 === 1) return text;

  // Only look at the last paragraph: earlier ones are already complete.
  const tail = text.slice(text.lastIndexOf("\n\n") + 1);
  let suffix = "";
  const ticks = tail.match(/`/g)?.length ?? 0;
  if (ticks % 2 === 1) suffix += "`";
  // Inline code can contain asterisks; ignore them when counting.
  const prose = tail.replace(/`[^`]*`?/g, "");
  const bold = prose.match(/\*\*/g)?.length ?? 0;
  if (bold % 2 === 1) suffix = `**${suffix}`;
  // A lone trailing "*" or "**" is a marker still being typed: hide it.
  const trimmed = text.replace(/(^|\s)\*{1,2}$/, "$1");
  return trimmed === text ? text + suffix : trimmed;
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, permissions): no-op.
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-[10px] border border-border bg-muted/60 first:mt-0 last:mb-0">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground lowercase">
          {language ?? "código"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copiado" : "Copiar código"}
          className="-mr-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.25 text-success" />
          ) : (
            <Copy className="size-3.25" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[13px] leading-[1.6]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  p: ({ node: _, ...props }) => (
    <p className="my-3 first:mt-0 last:mb-0" {...props} />
  ),
  h1: ({ node: _, ...props }) => (
    <h1
      className="mt-6 mb-3 font-serif text-[22px] leading-tight font-medium first:mt-0"
      {...props}
    />
  ),
  h2: ({ node: _, ...props }) => (
    <h2
      className="mt-5 mb-2.5 font-serif text-[19px] leading-snug font-medium first:mt-0"
      {...props}
    />
  ),
  h3: ({ node: _, ...props }) => (
    <h3 className="mt-4 mb-2 text-[16px] font-semibold first:mt-0" {...props} />
  ),
  h4: ({ node: _, ...props }) => (
    <h4 className="mt-4 mb-2 text-[15px] font-semibold first:mt-0" {...props} />
  ),
  h5: ({ node: _, ...props }) => (
    <h5
      className="mt-3 mb-1.5 text-[15px] font-semibold text-ink-2 first:mt-0"
      {...props}
    />
  ),
  h6: ({ node: _, ...props }) => (
    <h6
      className="mt-3 mb-1.5 text-[14px] font-semibold text-ink-2 first:mt-0"
      {...props}
    />
  ),
  ul: ({ node: _, className, ...props }) => (
    <ul
      className={cn(
        "my-3 list-disc pl-6 marker:text-ink-3 first:mt-0 last:mb-0 [&_ol,&_ul]:my-1",
        // GFM task lists: no bullet, the checkbox is the marker.
        className?.includes("contains-task-list") && "list-none pl-1",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ node: _, ...props }) => (
    <ol
      className="my-3 list-decimal pl-6 marker:font-serif marker:text-[16px] marker:text-brand first:mt-0 last:mb-0 [&_ol,&_ul]:my-1"
      {...props}
    />
  ),
  li: ({ node: _, className, ...props }) => (
    <li
      className={cn(
        "my-1 pl-1 [&>p]:my-1",
        className?.includes("task-list-item") && "flex items-start gap-2 pl-0",
        className,
      )}
      {...props}
    />
  ),
  input: ({ node: _, ...props }) => (
    // Task list checkboxes are read-only in a reply.
    <input
      {...props}
      disabled
      className="mt-[0.4em] size-3.5 shrink-0 accent-brand"
    />
  ),
  blockquote: ({ node: _, ...props }) => (
    <blockquote
      className="my-3 border-l-2 border-input pl-4 text-ink-2 italic first:mt-0 last:mb-0"
      {...props}
    />
  ),
  hr: ({ node: _, ...props }) => (
    <hr className="my-5 border-border" {...props} />
  ),
  a: ({ node: _, ...props }) => (
    <a
      className="font-medium text-brand underline decoration-brand/40 underline-offset-2 transition-colors hover:decoration-brand"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: ({ node: _, ...props }) => (
    <strong className="font-semibold" {...props} />
  ),
  del: ({ node: _, ...props }) => (
    <del className="text-muted-foreground" {...props} />
  ),
  img: ({ node: _, alt, ...props }) => (
    // biome-ignore lint/performance/noImgElement: remote, unknown-size images
    <img alt={alt ?? ""} className="my-3 max-w-full rounded-lg" {...props} />
  ),
  table: ({ node: _, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-[10px] border border-border first:mt-0 last:mb-0">
      <table className="w-full border-collapse text-[14px]" {...props} />
    </div>
  ),
  thead: ({ node: _, ...props }) => (
    <thead className="bg-muted/60" {...props} />
  ),
  th: ({ node: _, style, ...props }) => (
    <th
      className="border-b border-border px-3 py-2 text-left font-semibold"
      style={style}
      {...props}
    />
  ),
  td: ({ node: _, style, ...props }) => (
    <td
      className="border-b border-border px-3 py-2 align-top [tr:last-child>&]:border-b-0"
      style={style}
      {...props}
    />
  ),
  // Fenced blocks are unwrapped here and drawn by `code` below.
  pre: ({ children }) => <>{children}</>,
  code: ({ node: _, className, children, ...props }) => {
    const language = /language-([\w+#-]+)/.exec(className ?? "")?.[1];
    const text = String(children ?? "");
    // Fenced code always ends in a newline (or names a language); inline
    // code never contains one, since Markdown folds it into a space.
    if (language !== undefined || text.includes("\n")) {
      return <CodeBlock language={language} code={text.replace(/\n$/, "")} />;
    }
    return (
      <code
        className="rounded-[5px] bg-muted px-1.25 py-0.5 font-mono text-[0.86em] text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
};

/** Renders an assistant reply written in Markdown (GFM). */
export const Markdown = memo(function Markdown({
  text,
  streaming = false,
  className,
  ...props
}: {
  text: string;
  /** Repairs half-written syntax and shows the typing cursor at the end. */
  streaming?: boolean;
} & Omit<ComponentProps<"div">, "children">) {
  const source = normalizeMath(text);
  return (
    <div
      data-slot="markdown"
      data-streaming={streaming || undefined}
      className={cn(
        "markdown min-w-0 text-[15px] leading-[1.6] wrap-break-word",
        className,
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {streaming ? repairPartialMarkdown(hideOpenMath(source)) : source}
      </ReactMarkdown>
    </div>
  );
});
