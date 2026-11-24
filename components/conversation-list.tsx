"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { UNTITLED_CONVERSATION } from "@/lib/api/conversations";
import { useConversationsStore } from "@/stores/conversations-store";
import { ChatSideBarItems } from "./chat-sidebar-items";

/** The user's chats, most recently active first, loaded page by page. */
export function ConversationList() {
  const pathname = usePathname();
  const conversations = useConversationsStore((s) => s.conversations);
  const status = useConversationsStore((s) => s.status);
  const load = useConversationsStore((s) => s.load);
  const hasMore = useConversationsStore((s) => s.nextCursor !== null);
  const loadingMore = useConversationsStore((s) => s.loadingMore);
  const loadMoreFailed = useConversationsStore((s) => s.loadMoreFailed);
  const loadMore = useConversationsStore((s) => s.loadMore);
  const sentinel = useRef<HTMLDivElement>(null);

  // Also reloads after a reset (e.g. the user changed while mounted).
  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  // Fetch the next page when the end of the list scrolls into view.
  const watchSentinel = status === "ready" && hasMore && !loadMoreFailed;
  useEffect(() => {
    const node = sentinel.current;
    if (!watchSentinel || !node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [watchSentinel, loadMore]);

  if (status === "error") {
    return (
      <p className="px-2.5 text-[13px] text-ink-3">
        Não foi possível carregar suas conversas.{" "}
        <button
          type="button"
          onClick={() => load(true)}
          className="cursor-pointer font-medium text-foreground hover:underline"
        >
          Tentar de novo
        </button>
      </p>
    );
  }

  if (status !== "ready") {
    return <LoadingRows widths={["w-3/4", "w-2/3", "w-4/5", "w-1/2"]} />;
  }

  if (!conversations) {
    return (
      <p className="px-2.5 text-[13px] text-ink-3">
        Suas conversas aparecem aqui.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {conversations.map((conversation) => {
        const href = `/chat/${conversation.id}`;
        return (
          <ChatSideBarItems
            key={conversation.id}
            id={conversation.id}
            href={href}
            text={conversation.title ?? UNTITLED_CONVERSATION}
            isSelected={pathname === href}
          />
        );
      })}
      {loadingMore && <LoadingRows widths={["w-2/3", "w-1/2"]} />}
      {loadMoreFailed && (
        <button
          type="button"
          onClick={() => loadMore()}
          className="cursor-pointer px-2.5 py-2 text-left text-[13px] text-ink-3 hover:text-foreground"
        >
          Não foi possível carregar mais. Tentar de novo
        </button>
      )}
      {hasMore && <div ref={sentinel} className="h-px" />}
    </div>
  );
}

function LoadingRows({ widths }: { widths: string[] }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-0.5">
      {widths.map((width) => (
        <div key={width} className="flex h-8.5 items-center px-2.5">
          <span
            className={`h-3 animate-pulse rounded-full bg-accent ${width}`}
          />
        </div>
      ))}
    </div>
  );
}
