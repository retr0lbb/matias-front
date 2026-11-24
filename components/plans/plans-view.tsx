"use client";

import { cn } from "cn";
import { Check, Gauge, Minus, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlans, type Plan, type PlanLimits } from "@/lib/api/subscription";
import {
  FREE_PLAN_LIMITS,
  formatPrice,
  intervalLabel,
  planFeatures,
} from "@/lib/plans";
import { cycleLabel, planName, resetsInLabel } from "@/lib/usage-format";
import { useUsageStore } from "@/stores/usage-store";
import { Button } from "../ui/button";
import { UsageDialog } from "../usage-dialog";
import { CheckoutDialog } from "./checkout-dialog";

type PlansState =
  | { status: "loading" }
  | { status: "ready"; plans: Plan[] }
  | { status: "error" };

/** The plans page: free vs paid plans, the current one and how to upgrade. */
export function PlansView() {
  const usage = useUsageStore((s) => s.usage);
  const loadUsage = useUsageStore((s) => s.load);
  const [state, setState] = useState<PlansState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [usageOpen, setUsageOpen] = useState(false);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // `attempt` only re-runs the fetch when the user retries.
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getPlans().then(
      (plans) => {
        if (cancelled) return;
        const onSale = plans
          .filter((p) => p.is_active)
          .sort((a, b) => a.price - b.price);
        setState({ status: "ready", plans: onSale });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const currentSlug = usage?.plan.slug;
  const resetsIn = usage ? resetsInLabel(usage.cycle.resetsAt) : null;

  return (
    <div className="mx-auto flex w-full max-w-215 flex-col gap-8 px-6 pt-10 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[32px] leading-tight font-medium tracking-[-0.01em]">
          Planos
        </h1>
        <p className="max-w-130 text-[15px] text-ink-2">
          Mais mensagens, documentos e arquivos para preparar suas aulas com o
          MATIAS.
        </p>
      </header>

      {usage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3">
          <p className="text-sm">
            Você está no plano{" "}
            <span className="font-medium">{planName(usage.plan)}</span>
            <span className="text-muted-foreground">
              {" "}
              · ciclo {cycleLabel(usage.cycle.kind)}
              {resetsIn && ` · ${resetsIn.toLowerCase()}`}
            </span>
          </p>
          <Button
            variant="ghost"
            onClick={() => setUsageOpen(true)}
            className="h-8 gap-2 rounded-lg px-2.5 text-[13px] text-ink-2"
          >
            <Gauge className="size-4" />
            Ver meu uso
          </Button>
        </div>
      )}

      <div className="grid items-start gap-4 md:grid-cols-2">
        <PlanCard
          name="Gratuito"
          price="R$ 0"
          priceNote={`ciclo ${cycleLabel(FREE_PLAN_LIMITS.cycle)}`}
          description="Para conhecer o MATIAS e preparar algumas aulas por semana."
          limits={FREE_PLAN_LIMITS}
          current={currentSlug === "free"}
        />

        {state.status === "ready" &&
          state.plans.map((plan) => (
            <PlanCard
              key={plan.id}
              name={planName(plan)}
              price={formatPrice(plan.price, plan.currency)}
              priceNote={`por ${intervalLabel(plan.billing_interval)}`}
              description={plan.description ?? undefined}
              limits={plan.limits}
              highlighted
              current={currentSlug === plan.slug}
              action={
                currentSlug === plan.slug ? null : (
                  <Button
                    onClick={() => setCheckoutPlan(plan)}
                    // Until /usage answers we don't know the current plan.
                    disabled={!usage}
                    className="h-10 w-full gap-2 rounded-[10px] bg-brand text-white hover:bg-brand/90"
                  >
                    <Sparkles className="size-4" />
                    Assinar o {planName(plan)}
                  </Button>
                )
              }
            />
          ))}

        {state.status === "loading" && <PlanCardSkeleton />}

        {state.status === "error" && (
          <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os planos.
            </p>
            <Button
              variant="outline"
              onClick={() => setAttempt((n) => n + 1)}
              className="h-8 gap-2 rounded-lg px-3 text-[13px]"
            >
              <RotateCcw className="size-3.5" />
              Tentar de novo
            </Button>
          </div>
        )}
      </div>

      {checkoutPlan && (
        <CheckoutDialog
          plan={checkoutPlan}
          open
          onOpenChange={(open) => {
            if (!open) setCheckoutPlan(null);
          }}
        />
      )}
      <UsageDialog open={usageOpen} onOpenChange={setUsageOpen} />
    </div>
  );
}

function PlanCard({
  name,
  price,
  priceNote,
  description,
  limits,
  highlighted = false,
  current = false,
  action,
}: {
  name: string;
  price: string;
  priceNote: string;
  description?: string;
  limits: PlanLimits;
  highlighted?: boolean;
  current?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <section
      aria-label={`Plano ${name}`}
      className={cn(
        "relative flex flex-col gap-5 rounded-2xl border bg-surface p-6",
        highlighted && "border-brand/40 shadow-[0_12px_32px_#e11d2a14]",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            className={cn(
              "font-brand text-xl font-black italic tracking-[-0.01em]",
              highlighted && "text-brand",
            )}
          >
            {name}
          </h2>
          {current && (
            <span className="flex h-5.5 items-center rounded-full bg-secondary px-2 text-xs font-medium">
              Plano atual
            </span>
          )}
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif text-[34px] leading-none font-medium tabular-nums">
            {price}
          </span>
          <span className="text-sm text-muted-foreground">{priceNote}</span>
        </p>
        {description && (
          <p className="text-sm text-ink-2 first-letter:uppercase">
            {description}
          </p>
        )}
      </div>

      {action}

      <ul className="flex flex-col border-t pt-1">
        {planFeatures(limits).map((feature) => (
          <li
            key={feature.label}
            className="flex items-start gap-2.5 border-b border-border/60 py-2.5 text-sm last:border-b-0"
          >
            {feature.included ? (
              <Check
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  highlighted ? "text-brand" : "text-success",
                )}
              />
            ) : (
              <Minus className="mt-0.5 size-4 shrink-0 text-ink-3" />
            )}
            <span
              className={cn(
                "flex min-w-0 flex-1 flex-wrap justify-between gap-x-3",
                !feature.included && "text-muted-foreground",
              )}
            >
              <span>{feature.label}</span>
              <span className="font-medium tabular-nums">{feature.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlanCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-5 rounded-2xl border bg-surface p-6"
    >
      <span className="sr-only">Carregando planos…</span>
      <span className="h-5 w-16 animate-pulse rounded-full bg-accent" />
      <span className="h-8 w-36 animate-pulse rounded-full bg-accent" />
      <span className="h-10 w-full animate-pulse rounded-[10px] bg-secondary" />
      <div className="flex flex-col gap-3 pt-2">
        {["w-4/5", "w-3/4", "w-2/3", "w-5/6", "w-1/2", "w-3/5"].map((w) => (
          <span
            key={w}
            className={`h-3 animate-pulse rounded-full bg-accent ${w}`}
          />
        ))}
      </div>
    </div>
  );
}
