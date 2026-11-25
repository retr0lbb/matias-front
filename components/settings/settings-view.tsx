"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { ClassroomCard } from "./classroom-card";

const PROVIDER_LABELS = {
  LOCAL: "E-mail e senha",
  GOOGLE: "Conta Google",
} as const;

/** Account settings and integrations. */
export function SettingsView() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-10 px-4 pt-16 pb-16 sm:px-6 md:pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight sm:text-[32px] font-medium tracking-[-0.01em]">
          Configurações
        </h1>
        <p className="text-[15px] text-ink-2">
          Sua conta e os serviços conectados ao MATIAS.
        </p>
      </header>

      <Section title="Conta">
        <dl className="flex flex-col rounded-2xl border bg-surface px-6">
          <Row label="Nome">{user?.name || "—"}</Row>
          <Row label="E-mail">
            <span className="flex flex-wrap items-center gap-2">
              {user?.email || "—"}
              {user && !user.emailVerified && (
                <span className="flex h-5 items-center rounded-full bg-secondary px-2 text-[11px] font-medium text-ink-2">
                  Não confirmado
                </span>
              )}
            </span>
          </Row>
          {user?.loginProvider && (
            <Row label="Forma de entrar">
              {PROVIDER_LABELS[user.loginProvider]}
            </Row>
          )}
        </dl>
      </Section>

      <Section title="Integrações">
        <ClassroomCard />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-ink-3 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-6">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  );
}
