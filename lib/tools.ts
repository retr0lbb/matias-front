import {
  BookOpenText,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  type LucideIcon,
  NotebookPen,
  PencilLine,
  School,
  Send,
  UsersRound,
} from "lucide-react";
import type { DocumentType } from "@/lib/api/conversations";

export type ToolCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Put in the composer when the card is clicked; the teacher edits it. */
  prompt: string;
};

export type ToolGroup = {
  id: "documents" | "classroom";
  title: string;
  description: string;
  tools: ToolCard[];
};

/**
 * Documents the assistant generates (`documentType` in the chat stream).
 * Ids match the backend's document types.
 */
const DOCUMENT_TOOLS: (ToolCard & { id: DocumentType })[] = [
  {
    id: "assessment",
    title: "Avaliação",
    description: "Prova com questões objetivas e discursivas, com gabarito.",
    icon: ClipboardCheck,
    prompt:
      "Crie uma avaliação de [disciplina] para o [ano/série] sobre [conteúdo], com 10 questões objetivas e 2 discursivas, e gabarito.",
  },
  {
    id: "homework",
    title: "Lista de exercícios",
    description: "Exercícios para casa em ordem de dificuldade, com gabarito.",
    icon: PencilLine,
    prompt:
      "Monte uma lista de exercícios de [disciplina] para o [ano/série] sobre [conteúdo], do mais fácil ao mais difícil, com gabarito.",
  },
  {
    id: "lesson_plan",
    title: "Plano de aula",
    description: "Objetivos, sequência didática, materiais e avaliação.",
    icon: NotebookPen,
    prompt:
      "Monte um plano de aula de 50 minutos de [disciplina] para o [ano/série] sobre [conteúdo].",
  },
  {
    id: "course_syllabus",
    title: "Ementa",
    description: "Ementa do curso com objetivos, conteúdos e bibliografia.",
    icon: BookOpenText,
    prompt:
      "Escreva a ementa de [disciplina] para o [ano/série], com objetivos, conteúdo programático por bimestre e bibliografia.",
  },
  {
    id: "group_work",
    title: "Trabalho em grupo",
    description: "Proposta de trabalho com etapas, papéis e critérios.",
    icon: UsersRound,
    prompt:
      "Proponha um trabalho em grupo de [disciplina] para o [ano/série] sobre [conteúdo], com etapas, papéis e critérios de avaliação.",
  },
];

/** The Classroom tools from the backend spec (`CLASSROOM_TOOL_NAMES`). */
const CLASSROOM_TOOLS: ToolCard[] = [
  {
    id: "classroom_list_courses",
    title: "Ver minhas turmas",
    description: "Lista as turmas ativas em que você é professor.",
    icon: School,
    prompt: "Quais são minhas turmas no Classroom?",
  },
  {
    id: "classroom_get_course",
    title: "Detalhes da turma",
    description: "Seção, sala, link e quantos alunos a turma tem.",
    icon: ClipboardList,
    prompt: "Quantos alunos tem a turma [nome da turma]?",
  },
  {
    id: "classroom_list_students",
    title: "Lista de alunos",
    description: "Nomes dos alunos, só com a inicial do sobrenome.",
    icon: UsersRound,
    prompt: "Quem são os alunos da turma [nome da turma]?",
  },
  {
    id: "classroom_list_coursework",
    title: "Atividades da turma",
    description: "As 20 atividades mais recentes, publicadas e rascunhos.",
    icon: ListChecks,
    prompt: "Quais foram as últimas atividades da turma [nome da turma]?",
  },
  {
    id: "classroom_create_assignment",
    title: "Publicar atividade",
    description:
      "Cria um rascunho no Classroom, com a avaliação da conversa em PDF.",
    icon: Send,
    prompt:
      "Crie uma atividade na turma [nome da turma] com prazo para [data], anexando a avaliação desta conversa.",
  },
];

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "documents",
    title: "Documentos",
    description:
      "O MATIAS gera o documento no chat; você revisa, ajusta e baixa em PDF ou Word.",
    tools: DOCUMENT_TOOLS,
  },
  {
    id: "classroom",
    title: "Google Classroom",
    description:
      "Consulte suas turmas e publique atividades sem sair da conversa.",
    tools: CLASSROOM_TOOLS,
  },
];
