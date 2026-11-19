import {
  ArrowRight,
  ClipboardCheck,
  GraduationCap,
  NotebookPen,
  Send,
  Sparkles,
} from "lucide-react";
import { HomeComposer } from "@/components/home-composer";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

const suggestions = [
  {
    icon: ClipboardCheck,
    title: "Criar uma prova a partir da ementa",
    detail: "Questões objetivas e discursivas com gabarito",
  },
  {
    icon: NotebookPen,
    title: "Montar um plano de aula de 50 minutos",
    detail: "Objetivos, sequência, materiais e avaliação",
  },
  {
    icon: Send,
    title: "Publicar uma atividade no Classroom",
    detail: "Escolha a turma, o prazo e revise antes de enviar",
  },
];

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col px-5 pt-3.5 pb-5">
        <header className="flex h-9 items-center justify-end gap-2">
          <Button
            variant="outline"
            className="h-8 gap-2 rounded-lg bg-card px-3 text-[13px]"
          >
            <Sparkles className="size-3.75 text-brand" />
            Conhecer o Pro
          </Button>
          <div className="flex h-8 items-center gap-2 rounded-full border bg-surface pr-3 pl-2.5 text-[13px] text-ink-2">
            <GraduationCap className="size-3.75" />6 turmas sincronizadas
            <span className="size-1.75 rounded-full bg-success" />
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center overflow-y-auto pb-10">
          <div className="flex w-full max-w-180 flex-col gap-7">
            <div className="flex flex-col gap-2 px-1">
              <h2 className="font-serif text-[44px] leading-[1.1] tracking-[-0.02em]">
                Boa tarde, Henrique.
              </h2>
              <p className="font-serif text-xl italic text-ink-2">
                O que vamos preparar para as suas turmas hoje?
              </p>
            </div>

            <HomeComposer />

            <ul className="flex flex-col">
              {suggestions.map(({ icon: Icon, title, detail }, i) => (
                <li key={title}>
                  <button
                    type="button"
                    className={`group flex w-full cursor-pointer items-center gap-3.5 border-b px-3 py-3.25 text-left transition-colors hover:bg-muted/60 ${i === 0 ? "border-t" : ""}`}
                  >
                    <Icon className="size-4.5 shrink-0 text-ink-2" />
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="text-sm font-medium">{title}</span>
                      <span className="truncate text-[13px] text-ink-3">
                        {detail}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="text-center text-xs text-ink-3">
          O MATIAS pode errar. Revise o material antes de publicar para seus
          alunos.
        </footer>
      </main>
    </div>
  );
}
