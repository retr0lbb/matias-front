import type { StreamDocument } from "@/lib/api/chat-stream";
import type { DocumentType, ModelTier } from "@/lib/api/conversations";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  assessment: "Avaliação",
  homework: "Lista de exercícios",
  lesson_plan: "Plano de aula",
  course_syllabus: "Ementa",
  group_work: "Trabalho em grupo",
};

/** With article, for sentences: "Criando o plano de aula…". */
const DOCUMENT_NOUNS: Record<DocumentType, string> = {
  assessment: "a avaliação",
  homework: "a lista de exercícios",
  lesson_plan: "o plano de aula",
  course_syllabus: "a ementa",
  group_work: "o trabalho em grupo",
};

export const ACTION_LABELS: Record<StreamDocument["action"], string> = {
  CREATE: "criado",
  REVISE: "revisado",
  REGENERATE: "refeito",
};

const ACTION_VERBS: Record<StreamDocument["action"], string> = {
  CREATE: "Criando",
  REVISE: "Revisando",
  REGENERATE: "Refazendo",
};

export function documentingLabel(
  action: StreamDocument["action"],
  documentType: DocumentType,
) {
  return `${ACTION_VERBS[action]} ${DOCUMENT_NOUNS[documentType] ?? "o documento"}…`;
}

export function documentFailedLabel(documentType: DocumentType) {
  return `Não foi possível gerar ${DOCUMENT_NOUNS[documentType] ?? "o documento"}.`;
}

export function documentDetail(
  doc: Pick<StreamDocument, "documentType" | "action" | "version">,
) {
  return `${DOCUMENT_LABELS[doc.documentType] ?? "Documento"} · ${ACTION_LABELS[doc.action]} · versão ${doc.version}`;
}

export const TIER_LABELS: Record<ModelTier, string> = {
  CHEAP: "Base",
  NORMAL: "Avançado",
  EXPENSIVE: "Ultra avançado",
};
