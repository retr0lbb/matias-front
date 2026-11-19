import type { ReasoningId } from "@/stores/ui-store";
import type { AssistantMessage, UserMessage } from "./types";

/** Phases cycled by the simple "thinking" indicator while a reply is pending. */
export const THINKING_PHASES = [
  "Lendo o seu pedido…",
  "Consultando a BNCC…",
  "Organizando o material…",
  "Revisando a resposta…",
];

/** How long the fake reply takes, per reasoning level (ms). */
export const FAKE_REPLY_DELAY: Record<ReasoningId, number> = {
  padrao: 2500,
  alto: 5000,
  ultra: 8000,
};

let counter = 0;
export function createMessageId() {
  counter += 1;
  return `msg_${Date.now()}_${counter}`;
}

/**
 * Builds a canned assistant reply. Stand-in until the real API exists.
 * With reasoning above "padrao" the reply carries a detailed thinking trace.
 */
export function createFakeReply(
  user: UserMessage,
  reasoning: ReasoningId,
  elapsedMs: number,
): AssistantMessage {
  const file = user.attachments?.[0];
  const blocks: AssistantMessage["blocks"] = [
    {
      type: "paragraph",
      text: file
        ? `Li o arquivo ${file.name} e preparei uma primeira versão com base no seu pedido. Revise e me diga o que ajustar.`
        : "Preparei uma primeira versão com base no seu pedido. Revise e me diga o que ajustar — posso mudar o nível, o tamanho ou o formato.",
    },
  ];

  if (/prova|avalia|atividade|plano|rubrica/i.test(user.text)) {
    blocks.push({
      type: "document",
      title: "Rascunho — material da aula",
      detail: "Documento · versão 1",
    });
  }

  return {
    id: createMessageId(),
    role: "assistant",
    thinking:
      reasoning === "padrao"
        ? undefined
        : {
            seconds: Math.max(1, Math.round(elapsedMs / 1000)),
            steps: [
              {
                title: "Entendendo o pedido",
                text: `O pedido é: “${user.text.slice(0, 120)}${user.text.length > 120 ? "…" : ""}”.`,
              },
              {
                title: "Planejando a resposta",
                text: "Separar objetivo, público e formato antes de escrever, e manter a linguagem adequada à turma.",
              },
            ],
          },
    blocks,
  };
}
