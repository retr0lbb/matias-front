"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { verifyEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearVerificationSent } from "@/lib/verification-cooldown";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "./ui/button";

type Result =
  | { status: "verifying" }
  | { status: "verified"; email: string }
  | { status: "failed"; message: string };

// A token works once, so share one request per token. This keeps React's
// development double-effect (and remounts) from sending it twice.
const requests = new Map<string, Promise<Result>>();

function confirm(token: string): Promise<Result> {
  let request = requests.get(token);
  if (!request) {
    request = verifyEmail(token).then(
      ({ email }): Result => ({ status: "verified", email }),
      (error): Result => ({
        status: "failed",
        message:
          error instanceof ApiError && error.status < 500
            ? error.message
            : "Não foi possível confirmar seu e-mail agora. Tente novamente em instantes.",
      }),
    );
    requests.set(token, request);
  }
  return request;
}

export function VerifyEmail() {
  const token = useSearchParams().get("token");
  const user = useAuthStore((s) => s.user);
  const setEmailVerified = useAuthStore((s) => s.setEmailVerified);
  const [result, setResult] = useState<Result>({ status: "verifying" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    confirm(token).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const verifiedEmail = result.status === "verified" ? result.email : null;
  useEffect(() => {
    if (!verifiedEmail) return;
    clearVerificationSent();
    // Update the signed-in user if this link was for their address.
    const current = useAuthStore.getState().user;
    if (current?.email.toLowerCase() === verifiedEmail.toLowerCase()) {
      setEmailVerified(true);
    }
  }, [verifiedEmail, setEmailVerified]);

  if (!token) {
    return (
      <Failed
        message="O link de confirmação está incompleto. Abra o link direto do e-mail que enviamos."
        signedIn={Boolean(user)}
      />
    );
  }

  if (result.status === "verifying") {
    return (
      <Screen
        icon={<LoaderCircle className="size-5 animate-spin text-ink-2" />}
        title="Confirmando seu e-mail…"
        description="Só um instante."
      />
    );
  }

  if (result.status === "failed") {
    return <Failed message={result.message} signedIn={Boolean(user)} />;
  }

  return (
    <Screen
      icon={<CircleCheck className="size-5 text-ink-2" />}
      title="E-mail confirmado"
      description={
        <>
          O e-mail{" "}
          <span className="font-medium text-foreground">{result.email}</span>{" "}
          foi confirmado. Sua conta está pronta para usar.
        </>
      }
      action={
        user ? (
          <LinkButton href="/">Continuar para o MATIAS</LinkButton>
        ) : (
          <LinkButton href="/login">Entrar</LinkButton>
        )
      }
    />
  );
}

function Failed({ message, signedIn }: { message: string; signedIn: boolean }) {
  return (
    <Screen
      icon={<CircleAlert className="size-5 text-destructive" />}
      title="Não foi possível confirmar"
      description={
        <>
          {message}
          <br />
          {signedIn
            ? "Você pode pedir um novo link de confirmação."
            : "Entre na sua conta para pedir um novo link."}
        </>
      }
      action={
        signedIn ? (
          <LinkButton href="/check-email">Pedir um novo link</LinkButton>
        ) : (
          <LinkButton href="/login">Entrar</LinkButton>
        )
      }
    />
  );
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button nativeButton={false} render={<Link href={href} />} className="h-10">
      {children}
    </Button>
  );
}

function Screen({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div aria-live="polite" className="flex w-full max-w-95 flex-col gap-5.5">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[34px] leading-tight tracking-[-0.02em]">
          {title}
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
