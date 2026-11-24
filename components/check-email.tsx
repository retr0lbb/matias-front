"use client";

import { CircleCheck, MailCheck, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resendVerificationEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  clearVerificationSent,
  getVerificationSentAt,
  markVerificationSent,
  RESEND_COOLDOWN_MS,
} from "@/lib/verification-cooldown";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "./ui/button";

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Seconds left until `deadline`, ticking once per second. */
function useSecondsUntil(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    if (secondsLeft === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  return secondsLeft;
}

type Notice = { tone: "success" | "error"; text: string } | null;

export function CheckEmail() {
  // AuthGuard renders this only for a signed-in user, on the client.
  const user = useAuthStore((s) => s.user);
  const setEmailVerified = useAuthStore((s) => s.setEmailVerified);

  // The countdown starts when the last e-mail was sent (saved by register or
  // a resend), or now if we don't know, and survives a refresh.
  const [sentAt, setSentAt] = useState(
    () => getVerificationSentAt() ?? markVerificationSent(),
  );
  const secondsLeft = useSecondsUntil(sentAt + RESEND_COOLDOWN_MS);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  if (!user) return null;

  if (user.emailVerified) {
    return <AlreadyVerified email={user.email} />;
  }

  async function handleResend() {
    setSending(true);
    setNotice(null);
    try {
      await resendVerificationEmail();
      setSentAt(markVerificationSent());
      setNotice({ tone: "success", text: "Enviamos um novo link para você." });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        clearVerificationSent();
        setEmailVerified(true);
        return;
      }
      setNotice({
        tone: "error",
        text:
          error instanceof ApiError && error.status < 500
            ? error.message
            : "Não foi possível reenviar agora. Tente novamente.",
      });
    } finally {
      setSending(false);
    }
  }

  const coolingDown = secondsLeft > 0;

  return (
    <div className="flex w-full max-w-95 flex-col gap-5.5">
      <span className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border">
        <MailCheck className="size-5 text-ink-2" aria-hidden="true" />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[34px] leading-tight tracking-[-0.02em]">
          Confira seu e-mail
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Enviamos um link de confirmação para{" "}
          <span className="font-medium text-foreground">{user.email}</span>.
          Abra o e-mail e clique no link para confirmar sua conta.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={coolingDown || sending}
          className="h-10 gap-2 bg-card"
        >
          <RotateCw
            className={sending ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          {sending
            ? "Reenviando…"
            : coolingDown
              ? `Reenviar e-mail em ${formatSeconds(secondsLeft)}`
              : "Reenviar e-mail"}
        </Button>

        <p
          aria-live="polite"
          className={
            notice?.tone === "error"
              ? "text-[13px] text-destructive"
              : "text-[13px] text-muted-foreground"
          }
        >
          {notice?.text ??
            "Não encontrou? Confira a caixa de spam ou de promoções."}
        </p>
      </div>

      <Button nativeButton={false} render={<Link href="/" />} className="h-10">
        Continuar para o MATIAS
      </Button>
    </div>
  );
}

function AlreadyVerified({ email }: { email: string }) {
  return (
    <div className="flex w-full max-w-95 flex-col gap-5.5">
      <span className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border">
        <CircleCheck className="size-5 text-ink-2" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[34px] leading-tight tracking-[-0.02em]">
          E-mail já confirmado
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          O e-mail <span className="font-medium text-foreground">{email}</span>{" "}
          já está confirmado. Você pode usar o MATIAS normalmente.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />} className="h-10">
        Continuar para o MATIAS
      </Button>
    </div>
  );
}
