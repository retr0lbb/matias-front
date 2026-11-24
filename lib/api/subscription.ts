import { apiFetch } from "./client";
import type { ThinkingLevel } from "./conversations";

/** A plan's limits per cycle. `null` means unlimited. */
export type PlanLimits = {
  cycle: "DAILY" | "WEEKLY" | "MONTHLY" | (string & {});
  maxFileBytes: number | null;
  storageBytes: number | null;
  classroomTools: boolean;
  uploadsPerCycle: number | null;
  maxThinkingLevel: ThinkingLevel;
  messagesPerCycle: {
    cheap: number | null;
    normal: number | null;
    expensive: number | null;
  };
  documentsPerCycle: number | null;
  aiChangesPerDocument: number | null;
};

/** A paid plan from `GET /subscription/plans`. */
export type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** In cents: 2990 = R$ 29,90. */
  price: number;
  currency: string;
  billing_interval: "MONTHLY" | "YEARLY" | (string & {});
  is_active: boolean;
  limits: PlanLimits;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethod = "PIX" | "CREDIT_CARD";

export type SubscribeInput = {
  planId: string;
  paymentMethod: PaymentMethod;
  fullName: string;
  /** Digits only. */
  cpf: string;
  discountCode?: string;
};

/** The plans on sale (public route; the free plan isn't listed). */
export function getPlans() {
  return apiFetch<Plan[]>("/subscription/plans");
}

/** Starts a subscription. The answer's shape isn't documented yet. */
export function subscribe(input: SubscribeInput) {
  return apiFetch<unknown>("/subscription", { method: "POST", body: input });
}

/**
 * Finds where to send the user to pay, if the backend answered with a
 * checkout link (hosted payment page). Looks one level deep.
 */
export function paymentUrlFrom(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return;
  const isUrl = (v: unknown): v is string =>
    typeof v === "string" && /^https:\/\//i.test(v);
  const keys = [
    "checkoutUrl",
    "paymentUrl",
    "url",
    "invoiceUrl",
    "billingUrl",
    "redirectUrl",
  ];
  const record = data as Record<string, unknown>;
  for (const key of keys) if (isUrl(record[key])) return record[key];
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      for (const key of keys) if (isUrl(nested[key])) return nested[key];
    }
  }
}
