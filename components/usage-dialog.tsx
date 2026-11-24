"use client";

import { cn } from "cn";
import { RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import type { Usage } from "@/lib/api/usage";
import { TIER_LABELS } from "@/lib/chat/labels";
import {
  anyLimitReached,
  cycleLabel,
  formatBytes,
  planName,
  resetsAtLabel,
  resetsInLabel,
  THINKING_LABELS,
} from "@/lib/usage-format";
import { useUsageStore } from "@/stores/usage-store";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

/** The user's plan limits and what they've used this cycle (`GET /usage`). */
export function UsageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const usage = useUsageStore((s) => s.usage);
  const status = useUsageStore((s) => s.status);
  const load = useUsageStore((s) => s.load);

  // Fresh numbers every time it opens; the last ones show meanwhile.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Uso e limites</DialogTitle>
          <DialogDescription>
            {usage ? <CycleSummary usage={usage} /> : "Seu uso neste ciclo."}
          </DialogDescription>
        </DialogHeader>

        {usage ? (
          <UsageDetails usage={usage} />
        ) : status === "error" ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar seu uso.
            </p>
            <Button
              variant="outline"
              onClick={load}
              className="h-8 gap-2 rounded-lg px-3 text-[13px]"
            >
              <RotateCcw className="size-3.5" />
              Tentar de novo
            </Button>
          </div>
        ) : (
          <UsageSkeleton />
        )}

        {usage?.plan.slug === "free" && (
          <DialogFooter className="border-t pt-4">
            <Button
              nativeButton={false}
              render={<Link href="/plans" />}
              onClick={() => onOpenChange(false)}
              className="gap-2 bg-brand text-white hover:bg-brand/90"
            >
              <Sparkles className="size-4" />
              {usage && anyLimitReached(usage)
                ? "Aumentar meus limites"
                : "Conhecer o Pro"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CycleSummary({ usage }: { usage: Usage }) {
  const resetsIn = resetsInLabel(usage.cycle.resetsAt);
  const resetsAt = resetsAtLabel(usage.cycle.resetsAt);
  return (
    <>
      Plano{" "}
      <span className="font-medium text-foreground">
        {planName(usage.plan)}
      </span>{" "}
      · ciclo {cycleLabel(usage.cycle.kind)}
      {resetsIn && (
        <>
          <br />
          {resetsIn}
          {resetsAt && ` (${resetsAt})`}
        </>
      )}
    </>
  );
}

function UsageDetails({ usage }: { usage: Usage }) {
  const { messages, documentGeneration, uploads, storage } = usage;
  return (
    <div className="flex flex-col gap-5">
      <Section title="Mensagens">
        <Meter
          label={`Modelo ${TIER_LABELS.CHEAP}`}
          used={messages.cheap.used}
          limit={messages.cheap.limit}
        />
        <Meter
          label={`Modelo ${TIER_LABELS.NORMAL}`}
          used={messages.normal.used}
          limit={messages.normal.limit}
        />
        <Meter
          label={`Modelo ${TIER_LABELS.EXPENSIVE}`}
          used={messages.expensive.used}
          limit={messages.expensive.limit}
        />
        <p className="text-xs text-muted-foreground">
          Raciocínio máximo no seu plano:{" "}
          <span className="font-medium text-foreground">
            {THINKING_LABELS[usage.maxThinkingLevel] ?? usage.maxThinkingLevel}
          </span>
        </p>
      </Section>

      <Section title="Documentos">
        <Meter
          label="Documentos gerados"
          used={documentGeneration.used}
          limit={documentGeneration.limit}
        />
        {documentGeneration.aiChangesPerDocument !== null && (
          <p className="text-xs text-muted-foreground">
            Até {documentGeneration.aiChangesPerDocument} alterações com IA por
            documento.
          </p>
        )}
      </Section>

      <Section title="Arquivos">
        <Meter label="Envios" used={uploads.used} limit={uploads.limit} />
        <Meter
          label="Armazenamento"
          used={storage.usedBytes}
          limit={storage.limitBytes}
          format={formatBytes}
        />
        {usage.maxFileBytes !== null && (
          <p className="text-xs text-muted-foreground">
            Tamanho máximo por arquivo: {formatBytes(usage.maxFileBytes)}.
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium tracking-wide text-ink-3 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Meter({
  label,
  used,
  limit,
  format = String,
}: {
  label: string;
  used: number;
  limit: number | null;
  format?: (value: number) => string;
}) {
  const unlimited = limit === null;
  const exhausted = !unlimited && used >= limit;
  const ratio = unlimited || limit === 0 ? 1 : Math.min(1, used / limit);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span
          className={cn(
            "shrink-0 text-[13px] tabular-nums text-muted-foreground",
            exhausted && "font-medium text-brand",
          )}
        >
          {unlimited
            ? `${format(used)} · ilimitado`
            : `${format(used)} de ${format(limit)}`}
        </span>
      </div>
      {!unlimited && (
        // biome-ignore lint/a11y/useSemanticElements: <meter> can't be styled consistently across browsers
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(used, limit)}
          aria-valuetext={
            exhausted
              ? "Limite atingido"
              : `${format(used)} de ${format(limit)}`
          }
          className="h-1.5 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
              exhausted ? "bg-brand" : ratio >= 0.8 ? "bg-ink-2" : "bg-ink-3",
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      )}
      {exhausted && (
        <p className="text-xs text-brand">Limite atingido neste ciclo.</p>
      )}
    </div>
  );
}

function UsageSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      {[3, 1, 2].map((rows, section) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
        <div key={section} className="flex flex-col gap-3">
          <span className="h-2.5 w-20 animate-pulse rounded-full bg-accent" />
          {Array.from({ length: rows }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
            <div key={i} className="flex flex-col gap-2">
              <span className="h-3 w-2/5 animate-pulse rounded-full bg-accent" />
              <span className="h-1.5 w-full animate-pulse rounded-full bg-secondary" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
