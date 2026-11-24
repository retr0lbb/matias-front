import type { ThinkingLevel } from "@/lib/api/conversations";
import type { Usage, UsageCounter } from "@/lib/api/usage";

/** Backend plan names are in English; known slugs get a pt-BR name. */
const PLAN_NAMES: Record<string, string> = {
  free: "Gratuito",
  pro: "Pro",
};

export function planName(plan: Pick<Usage["plan"], "slug" | "name">) {
  return PLAN_NAMES[plan.slug] ?? plan.name;
}

const CYCLE_LABELS: Record<string, string> = {
  DAILY: "diário",
  WEEKLY: "semanal",
  MONTHLY: "mensal",
};

export function cycleLabel(kind: string) {
  return CYCLE_LABELS[kind] ?? kind.toLowerCase();
}

export const THINKING_LABELS: Record<ThinkingLevel, string> = {
  DEFAULT: "Padrão",
  HIGH: "Alto",
  ULTRA_HIGH: "Ultra",
};

const DAY = 24 * 60 * 60 * 1000;

/** "Renova hoje", "Renova amanhã", "Renova em 6 dias", in local time. */
export function resetsInLabel(resetsAt: string, now = Date.now()) {
  const target = new Date(resetsAt);
  if (Number.isNaN(target.getTime())) return null;
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(target) - startOf(new Date(now))) / DAY);
  if (target.getTime() <= now) return "Renova em instantes";
  if (days <= 0) return "Renova hoje";
  if (days === 1) return "Renova amanhã";
  return `Renova em ${days} dias`;
}

/** "dom., 29/11 às 21:00" in the user's time zone. */
export function resetsAtLabel(resetsAt: string) {
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${day} às ${time}`;
}

const sizeFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Binary sizes with pt-BR decimals: 209715200 → "200 MB". */
export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${sizeFormat.format(value)} ${units[unit]}`;
}

export function isExhausted({ used, limit }: UsageCounter) {
  return limit !== null && used >= limit;
}

/** Whether anything the user can run out of has run out this cycle. */
export function anyLimitReached(usage: Usage) {
  const counters: UsageCounter[] = [
    usage.messages.cheap,
    usage.messages.normal,
    usage.messages.expensive,
    usage.documentGeneration,
    usage.uploads,
    { used: usage.storage.usedBytes, limit: usage.storage.limitBytes },
  ];
  return counters.some(isExhausted);
}
