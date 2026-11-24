import type { PlanLimits } from "@/lib/api/subscription";
import { TIER_LABELS } from "@/lib/chat/labels";
import { cycleLabel, formatBytes, THINKING_LABELS } from "@/lib/usage-format";

/**
 * The free plan isn't returned by `/subscription/plans`, so its limits live
 * here (same numbers `/usage` reports for a free account).
 */
export const FREE_PLAN_LIMITS: PlanLimits = {
  cycle: "WEEKLY",
  maxFileBytes: 10 * 1024 * 1024,
  storageBytes: 200 * 1024 * 1024,
  classroomTools: false,
  uploadsPerCycle: 5,
  maxThinkingLevel: "HIGH",
  messagesPerCycle: { cheap: null, normal: 5, expensive: 2 },
  documentsPerCycle: 3,
  aiChangesPerDocument: 7,
};

/** 2990 + "BRL" → "R$ 29,90". */
export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    cents / 100,
  );
}

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "mês",
  YEARLY: "ano",
  WEEKLY: "semana",
};

export function intervalLabel(interval: string) {
  return INTERVAL_LABELS[interval] ?? interval.toLowerCase();
}

/** "por semana" / "por mês": how a cycle reads after a number. */
function perCycle(cycle: string) {
  return cycle === "WEEKLY"
    ? "por semana"
    : cycle === "MONTHLY"
      ? "por mês"
      : cycle === "DAILY"
        ? "por dia"
        : `por ciclo ${cycleLabel(cycle)}`;
}

export type PlanFeature = {
  /** Short label of what it is. */
  label: string;
  /** The amount, already formatted ("300 por mês", "Ilimitado"). */
  value: string;
  included: boolean;
};

function amount(limit: number | null, cycle: string, unit = "") {
  if (limit === null) return "Ilimitado";
  return `${limit}${unit} ${perCycle(cycle)}`;
}

/** The comparable list of what a plan offers, in display order. */
export function planFeatures(limits: PlanLimits): PlanFeature[] {
  const m = limits.messagesPerCycle;
  return [
    {
      label: `Mensagens com o modelo ${TIER_LABELS.CHEAP}`,
      value: amount(m.cheap, limits.cycle),
      included: true,
    },
    {
      label: `Mensagens com o modelo ${TIER_LABELS.NORMAL}`,
      value: amount(m.normal, limits.cycle),
      included: m.normal !== 0,
    },
    {
      label: `Mensagens com o modelo ${TIER_LABELS.EXPENSIVE}`,
      value: amount(m.expensive, limits.cycle),
      included: m.expensive !== 0,
    },
    {
      label: "Raciocínio máximo",
      value:
        THINKING_LABELS[limits.maxThinkingLevel] ?? limits.maxThinkingLevel,
      included: true,
    },
    {
      label: "Documentos gerados",
      value: amount(limits.documentsPerCycle, limits.cycle),
      included: limits.documentsPerCycle !== 0,
    },
    {
      label: "Alterações com IA por documento",
      value:
        limits.aiChangesPerDocument === null
          ? "Ilimitadas"
          : `Até ${limits.aiChangesPerDocument}`,
      included: limits.aiChangesPerDocument !== 0,
    },
    {
      label: "Envio de arquivos",
      value: amount(limits.uploadsPerCycle, limits.cycle),
      included: limits.uploadsPerCycle !== 0,
    },
    {
      label: "Armazenamento",
      value:
        limits.storageBytes === null
          ? "Ilimitado"
          : formatBytes(limits.storageBytes),
      included: limits.storageBytes !== 0,
    },
    {
      label: "Tamanho máximo por arquivo",
      value:
        limits.maxFileBytes === null
          ? "Sem limite"
          : formatBytes(limits.maxFileBytes),
      included: true,
    },
    {
      label: "Ferramentas do Google Classroom",
      value: limits.classroomTools ? "Incluídas" : "Não incluídas",
      included: limits.classroomTools,
    },
  ];
}
