"use client";

import { Brain, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const models = [
  {
    id: "auto",
    title: "Automático",
    description: "O MATIAS escolhe o modelo ideal para cada pedido",
  },
  {
    id: "base",
    title: "Base",
    description: "Rápido, para tarefas do dia a dia",
  },
  {
    id: "avancado",
    title: "Avançado",
    description: "Mais preciso em planos e avaliações",
  },
  {
    id: "ultra",
    title: "Ultra avançado",
    description: "Materiais longos e análises complexas",
  },
] as const;

const reasoningLevels = [
  { id: "padrao", label: "Padrão" },
  { id: "alto", label: "Alto" },
  { id: "ultra", label: "Ultra alto" },
] as const;

export function ModelPicker({
  side = "bottom",
}: {
  /** Where the menu opens: below on the home page, above in a chat thread. */
  side?: "top" | "bottom";
}) {
  const model = useUiStore((s) => s.model);
  const reasoning = useUiStore((s) => s.reasoning);
  const setModel = useUiStore((s) => s.setModel);
  const setReasoning = useUiStore((s) => s.setReasoning);

  const modelTitle = models.find((m) => m.id === model)?.title;
  const reasoningLabel = reasoningLevels.find((r) => r.id === reasoning)?.label;
  const Chevron = side === "top" ? ChevronUp : ChevronDown;

  return (
    <Popover>
      <PopoverTrigger className="flex h-8.5 cursor-pointer items-center gap-2 rounded-[9px] border px-2.5 text-[13px] text-ink-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ring">
        <span className="font-medium text-foreground">{modelTitle}</span>
        <span className="h-3.5 w-px bg-input" />
        <Brain className="size-3.5" />
        {reasoningLabel}
        <Chevron className="size-3.5 text-ink-3" />
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align="start"
        sideOffset={8}
        className="w-80 gap-0 rounded-xl p-1.5 shadow-[0_12px_32px_#1c1a1726] ring-border"
      >
        <p className="px-2.5 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">
          Modelo
        </p>
        {models.map((m) => {
          const selected = m.id === model;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                selected ? "bg-muted" : "hover:bg-muted/60",
                "cursor-pointer",
              )}
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {m.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {m.description}
                </span>
              </span>
              {selected && <Check className="size-4 text-foreground" />}
            </button>
          );
        })}

        <div className="px-1 py-1.5">
          <div className="h-px bg-border" />
        </div>

        <p className="px-2.5 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">
          Raciocínio
        </p>
        <div className="px-2.5 pb-1">
          <div className="flex h-8.5 gap-0.5 rounded-lg bg-muted p-0.75">
            {reasoningLevels.map((r) => {
              const selected = r.id === reasoning;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setReasoning(r.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.25 rounded-md text-[13px] transition-colors",
                    selected
                      ? "bg-card font-medium text-foreground shadow-[0_1px_3px_#1c1a171a]"
                      : "text-ink-2",
                    "cursor-pointer",
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="px-2.5 pt-1.5 pb-2 text-xs leading-[1.45] text-muted-foreground">
          Com mais raciocínio, o MATIAS pensa por mais tempo antes de responder.
          Alguns modelos e níveis dependem do seu plano.
        </p>
      </PopoverContent>
    </Popover>
  );
}
