"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TOOL_GROUPS, type ToolCard, type ToolGroup } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { useClassroomStore } from "@/stores/classroom-store";
import { useUiStore } from "@/stores/ui-store";
import { useUsageStore } from "@/stores/usage-store";
import { Button } from "../ui/button";

/** Everything the assistant can do, as cards that start a chat. */
export function ToolsView() {
  const router = useRouter();
  const setComposerDraft = useUiStore((s) => s.setComposerDraft);
  const loadUsage = useUsageStore((s) => s.load);
  const loadClassroom = useClassroomStore((s) => s.load);

  useEffect(() => {
    loadUsage();
    loadClassroom();
  }, [loadUsage, loadClassroom]);

  function start(tool: ToolCard) {
    setComposerDraft(tool.prompt);
    router.push("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-240 flex-col gap-10 px-6 pt-10 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[32px] leading-tight font-medium tracking-[-0.01em]">
          Ferramentas
        </h1>
        <p className="max-w-140 text-[15px] text-ink-2">
          Escolha uma ferramenta para começar uma conversa com um pedido de
          exemplo. Você pode editar o texto antes de enviar.
        </p>
      </header>

      {TOOL_GROUPS.map((group) => (
        <Group key={group.id} group={group} onStart={start} />
      ))}
    </div>
  );
}

function Group({
  group,
  onStart,
}: {
  group: ToolGroup;
  onStart: (tool: ToolCard) => void;
}) {
  const titleId = `tools-${group.id}`;
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={titleId} className="text-base font-medium">
            {group.title}
          </h2>
          <p className="text-sm text-ink-2">{group.description}</p>
        </div>
        {group.id === "classroom" && <ClassroomAccess />}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3">
        {group.tools.map((tool) => (
          <li key={tool.id} className="flex">
            <ToolCardButton tool={tool} onStart={() => onStart(tool)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ToolCardButton({
  tool,
  onStart,
}: {
  tool: ToolCard;
  onStart: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onStart}
      className="group flex w-full cursor-pointer flex-col gap-3 rounded-2xl border bg-surface p-4.5 text-left transition-[background-color,border-color,box-shadow] outline-none hover:border-input hover:shadow-[0_4px_16px_#1c1a170f] focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-tint text-brand">
          <Icon className="size-4.5" />
        </span>
        <ArrowUpRight className="size-4 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{tool.title}</span>
        <span className="text-[13px] leading-snug text-ink-2">
          {tool.description}
        </span>
      </span>
    </button>
  );
}

/** Whether the Classroom tools will work, and how to make them work. */
function ClassroomAccess() {
  const status = useClassroomStore((s) => s.status);
  const freePlan = useUsageStore((s) => s.usage?.plan.slug === "free");

  if (freePlan) {
    return (
      <Button
        nativeButton={false}
        render={<Link href="/plans" />}
        className="h-8 gap-2 rounded-lg bg-brand px-3 text-[13px] text-white hover:bg-brand/90"
      >
        <Sparkles className="size-3.5" />
        Disponível no Pro
      </Button>
    );
  }
  if (!status) return null;
  return status.connected ? (
    <span className="flex h-7 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-xs font-medium text-success">
      <span className="size-1.5 rounded-full bg-success" />
      Conectado{status.email ? ` · ${status.email}` : ""}
    </span>
  ) : (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link href="/settings#classroom" />}
      className={cn("h-8 rounded-lg px-3 text-[13px]")}
    >
      Conectar o Classroom
    </Button>
  );
}
