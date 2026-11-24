import { apiFetch } from "./client";
import type { ThinkingLevel } from "./conversations";

/** A counter for the current cycle. `limit: null` means unlimited. */
export type UsageCounter = { used: number; limit: number | null };

/** `GET /usage`: the plan, the current cycle and what's been used in it. */
export type Usage = {
  plan: { slug: string; name: string };
  cycle: {
    kind: "DAILY" | "WEEKLY" | "MONTHLY" | (string & {});
    start: string;
    resetsAt: string;
  };
  uploads: UsageCounter;
  storage: { usedBytes: number; limitBytes: number | null };
  maxFileBytes: number | null;
  messages: {
    cheap: UsageCounter;
    normal: UsageCounter;
    expensive: UsageCounter;
  };
  maxThinkingLevel: ThinkingLevel;
  documentGeneration: UsageCounter & {
    /** How many AI edits each generated document allows. */
    aiChangesPerDocument: number | null;
  };
};

export function getUsage() {
  return apiFetch<Usage>("/usage");
}
