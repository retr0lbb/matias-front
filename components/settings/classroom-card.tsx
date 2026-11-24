"use client";

import {
  CircleAlert,
  CircleCheck,
  GraduationCap,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Unplug,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { classroomConnectUrl } from "@/lib/api/classroom";
import { useClassroomStore } from "@/stores/classroom-store";
import { useUsageStore } from "@/stores/usage-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

/** Where the browser comes back to after Google's consent screen. */
const RETURN_TO = "/settings";
/**
 * Set right before leaving for Google, so that coming back can tell the
 * teacher whether the connection worked.
 */
const ATTEMPT_KEY = "matias:classroom-connect";
const ATTEMPT_MAX_AGE = 15 * 60 * 1000;

const PERMISSIONS = [
  "Ver as turmas em que você é professor",
  "Ver os nomes dos alunos (sem e-mails nem fotos)",
  "Criar atividades nas suas turmas, sempre como rascunho",
  "Salvar no seu Drive só os arquivos que o MATIAS cria",
];

function connectedSince(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Reads (and clears) the "just came back from Google" marker. */
function takeAttempt() {
  try {
    const value = sessionStorage.getItem(ATTEMPT_KEY);
    sessionStorage.removeItem(ATTEMPT_KEY);
    return value !== null && Date.now() - Number(value) < ATTEMPT_MAX_AGE;
  } catch {
    return false;
  }
}

/** Connects, shows and disconnects the teacher's Google Classroom. */
export function ClassroomCard() {
  const status = useClassroomStore((s) => s.status);
  const loading = useClassroomStore((s) => s.loading);
  const load = useClassroomStore((s) => s.load);
  const freePlan = useUsageStore((s) => s.usage?.plan.slug === "free");
  const loadUsage = useUsageStore((s) => s.load);
  const [returning, setReturning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setReturning(takeAttempt());
    load();
    loadUsage();
  }, [load, loadUsage]);

  // The result of a connect attempt is only known once the status is in.
  const outcome =
    returning && loading === "ready" && status
      ? status.connected
        ? "connected"
        : "failed"
      : null;

  function connect() {
    try {
      sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));
    } catch {
      // No feedback on return, but connecting still works.
    }
    setLeaving(true);
    window.location.assign(classroomConnectUrl(RETURN_TO));
  }

  const since = connectedSince(status?.connectedAt ?? null);

  return (
    <section
      id="classroom"
      aria-labelledby="classroom-title"
      className="flex scroll-mt-6 flex-col gap-5 rounded-2xl border bg-surface p-6"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1e8e3e]/10 text-[#1e8e3e]">
          <GraduationCap className="size-5.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="classroom-title" className="text-base font-medium">
              Google Classroom
            </h3>
            <StatusBadge connected={status?.connected} />
          </div>
          <p className="text-sm text-ink-2">
            Peça no chat para listar suas turmas, ver alunos e atividades, ou
            publicar uma avaliação como rascunho de atividade.
          </p>
        </div>
      </div>

      {outcome === "connected" && (
        <Banner tone="success">
          Google Classroom conectado. Já pode pedir no chat, por exemplo: “quais
          são minhas turmas?”
        </Banner>
      )}
      {outcome === "failed" && (
        <Banner tone="error">
          A conexão não foi concluída. Tente de novo e, na tela do Google,
          mantenha todas as permissões marcadas.
        </Banner>
      )}

      {status === null && loading === "error" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Não foi possível verificar a conexão.
          </p>
          <Button
            variant="outline"
            onClick={load}
            className="h-8 gap-2 rounded-lg px-3 text-[13px]"
          >
            <RotateCcw className="size-3.5" />
            Tentar de novo
          </Button>
        </div>
      ) : status === null ? (
        <div aria-busy="true" className="flex flex-col gap-2.5">
          <span className="sr-only">Verificando a conexão…</span>
          <span className="h-3 w-2/5 animate-pulse rounded-full bg-accent" />
          <span className="h-10 w-48 animate-pulse rounded-[10px] bg-secondary" />
        </div>
      ) : status.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {status.email ?? "Conta Google"}
            </span>
            {since && (
              <span className="text-xs text-muted-foreground">
                Conectado em {since}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="h-8 gap-2 rounded-lg px-3 text-[13px]"
          >
            <Unplug className="size-3.5" />
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-ink-2">
              O MATIAS vai pedir acesso para:
            </p>
            <ul className="flex flex-col gap-1.5">
              {PERMISSIONS.map((permission) => (
                <li
                  key={permission}
                  className="flex items-start gap-2 text-sm text-ink-2"
                >
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={connect}
              disabled={leaving}
              className="h-10 w-fit gap-2 rounded-[10px] px-4"
            >
              {leaving ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <GraduationCap className="size-4" />
              )}
              {leaving ? "Abrindo o Google…" : "Conectar Google Classroom"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Pode ser outra conta Google, como a da escola.
            </p>
          </div>
        </div>
      )}

      {freePlan && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-medium">
              As ferramentas do Classroom no chat fazem parte do Pro.
            </span>{" "}
            <span className="text-ink-2">
              Você pode conectar agora; elas passam a funcionar quando assinar.
            </span>
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/plans" />}
            className="h-8 gap-2 rounded-lg bg-brand px-3 text-[13px] text-white hover:bg-brand/90"
          >
            <Sparkles className="size-3.5" />
            Ver planos
          </Button>
        </div>
      )}

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Os alunos aparecem só com o primeiro nome e a inicial do sobrenome, e
        nada do que vem do Classroom fica salvo no MATIAS.
      </p>

      <DisconnectDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        email={status?.email ?? null}
      />
    </section>
  );
}

function StatusBadge({ connected }: { connected: boolean | undefined }) {
  if (connected === undefined) return null;
  return connected ? (
    <span className="flex h-5.5 items-center gap-1.5 rounded-full bg-success/10 px-2 text-xs font-medium text-success">
      <span className="size-1.5 rounded-full bg-success" />
      Conectado
    </span>
  ) : (
    <span className="flex h-5.5 items-center rounded-full bg-secondary px-2 text-xs font-medium text-ink-2">
      Não conectado
    </span>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div
      className={
        tone === "success"
          ? "flex items-start gap-2.5 rounded-xl bg-success/10 px-4 py-3 text-sm"
          : "flex items-start gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-sm"
      }
    >
      <Icon
        className={
          tone === "success"
            ? "mt-0.5 size-4 shrink-0 text-success"
            : "mt-0.5 size-4 shrink-0 text-destructive"
        }
      />
      <span>{children}</span>
    </div>
  );
}

function DisconnectDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string | null;
}) {
  const disconnect = useClassroomStore((s) => s.disconnect);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await disconnect();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Unplug />
          </AlertDialogMedia>
          <AlertDialogTitle>Desconectar o Google Classroom?</AlertDialogTitle>
          <AlertDialogDescription>
            O MATIAS perde o acesso
            {email && (
              <>
                {" "}
                à conta{" "}
                <span className="font-medium text-foreground">{email}</span>
              </>
            )}{" "}
            e não poderá mais consultar suas turmas nem criar atividades. O que
            já foi publicado no Classroom continua lá.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={confirm}
            disabled={busy}
            className="gap-2"
          >
            {busy && (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {busy ? "Desconectando…" : "Desconectar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
