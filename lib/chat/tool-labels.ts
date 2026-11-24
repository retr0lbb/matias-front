/** What each Classroom tool is doing, for the trace lines in the chat. */
const TOOL_LABELS: Record<
  string,
  { running: string; done: string; error: string }
> = {
  classroom_list_courses: {
    running: "Buscando suas turmas…",
    done: "Turmas consultadas",
    error: "Não foi possível buscar suas turmas",
  },
  classroom_get_course: {
    running: "Abrindo a turma…",
    done: "Turma consultada",
    error: "Não foi possível abrir a turma",
  },
  classroom_list_students: {
    running: "Lendo a lista de alunos…",
    done: "Lista de alunos consultada",
    error: "Não foi possível ler a lista de alunos",
  },
  classroom_list_coursework: {
    running: "Buscando as atividades da turma…",
    done: "Atividades consultadas",
    error: "Não foi possível buscar as atividades",
  },
  classroom_create_assignment: {
    running: "Criando o rascunho da atividade…",
    done: "Rascunho criado no Classroom",
    error: "Não foi possível criar a atividade",
  },
};

const FALLBACK = {
  running: "Usando o Google Classroom…",
  done: "Google Classroom consultado",
  error: "Falha no Google Classroom",
};

export function toolLabel(
  name: string,
  status: "running" | "done" | "error",
): string {
  return (TOOL_LABELS[name] ?? FALLBACK)[status];
}
