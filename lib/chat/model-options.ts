import type { ModelChoice } from "@/lib/api/chat-stream";
import type { ThinkingLevel } from "@/lib/api/conversations";
import type { ModelId, ReasoningId } from "@/stores/ui-store";

/** Composer model choice → `model` sent to `POST /ai/chat/stream`. */
export const MODEL_TO_API: Record<ModelId, ModelChoice> = {
  auto: "AUTO",
  base: "CHEAP",
  avancado: "NORMAL",
  ultra: "EXPENSIVE",
};

/** Composer reasoning choice → `thinkingLevel`. */
export const REASONING_TO_API: Record<ReasoningId, ThinkingLevel> = {
  padrao: "DEFAULT",
  alto: "HIGH",
  ultra: "ULTRA_HIGH",
};
