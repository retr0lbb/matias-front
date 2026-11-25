import {
  ArrowRight,
  ClipboardCheck,
  GraduationCap,
  NotebookPen,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { Greeting } from "@/components/greeting";
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
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col px-3 pb-3 md:px-5 md:pt-3.5 md:pb-5">
        <header className="flex h-12.5 shrink-0 items-center justify-end gap-2 pl-12 md:h-9 md:pl-0">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/plans" />}
            className="h-8 gap-2 rounded-lg bg-card px-3 text-[13px]"
          >
            <Sparkles className="size-3.75 text-brand" />
            Conhecer o Pro
          </Button>
          <div className="hidden h-8 items-center gap-2 rounded-full sm:flex border bg-surface pr-3 pl-2.5 text-[13px] text-ink-2">
            <GraduationCap className="size-3.75" />6 turmas sincronizadas
            <span className="size-1.75 rounded-full bg-success" />
          </div>
        </header>

        {/* Mobile: greeting and suggestions centered, composer docked at
            the bottom (like a chat). Desktop: everything centered. */}
        <section className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto md:justify-center md:pb-10">
          <div className="flex w-full max-w-180 flex-1 flex-col gap-5 md:flex-none md:gap-7">
            <div className="mt-auto flex flex-col gap-1.5 px-2 md:mt-0 md:gap-2 md:px-1">
              <Greeting />
              <p className="font-serif text-lg italic text-ink-2 md:text-xl">
                O que vamos preparar para as suas turmas hoje?
              </p>
            </div>

            <div className="sticky bottom-0 order-last bg-background pt-1 md:static md:order-none md:pt-0">
              <HomeComposer />
            </div>

            <ul className="mb-auto flex flex-col md:mb-0">
              {suggestions.map(({ icon: Icon, title, detail }, i) => (
                <li key={title}>
                  <button
                    type="button"
                    className={`group flex w-full cursor-pointer items-center gap-3.5 border-b px-3 py-3 md:py-3.25 text-left transition-colors hover:bg-muted/60 ${i === 0 ? "border-t" : ""}`}
                  >
                    <Icon className="size-4.5 shrink-0 text-ink-2" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2.5">
                      <span className="text-sm font-medium">{title}</span>
                      <span className="max-w-full truncate text-[13px] text-ink-3">
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

        <footer className="pt-2 text-center text-[11px] text-ink-3 md:pt-0 md:text-xs">
          O MATIAS pode errar. Revise o material antes de publicar para seus
          alunos.
        </footer>
      </main>
    </div>
  );
}
