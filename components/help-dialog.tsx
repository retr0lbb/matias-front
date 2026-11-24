"use client";

import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
  CONTACT_MAIL,
  CONTACT_NUMBER,
  formatPhone,
  mailtoUrl,
  whatsappUrl,
} from "@/lib/contact";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

/** "Central de ajuda": how to reach support. */
export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const none = !CONTACT_MAIL && !CONTACT_NUMBER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Central de ajuda</DialogTitle>
          <DialogDescription>
            {none
              ? "Os canais de atendimento não estão disponíveis no momento."
              : "Ficou com alguma dúvida ou encontrou um problema? Fale com a nossa equipe."}
          </DialogDescription>
        </DialogHeader>

        {!none && (
          <div className="flex flex-col gap-2.5">
            {CONTACT_NUMBER && (
              <ContactOption
                icon={<MessageCircle className="size-4.5" />}
                iconClassName="bg-[#25d366]/12 text-[#1a9e4b]"
                title="WhatsApp"
                value={formatPhone(CONTACT_NUMBER)}
                copyValue={formatPhone(CONTACT_NUMBER)}
                href={whatsappUrl(CONTACT_NUMBER)}
                external
                action="Abrir conversa"
              />
            )}
            {CONTACT_MAIL && (
              <ContactOption
                icon={<Mail className="size-4.5" />}
                iconClassName="bg-brand-tint text-brand"
                title="E-mail"
                value={CONTACT_MAIL}
                copyValue={CONTACT_MAIL}
                href={mailtoUrl(CONTACT_MAIL)}
                action="Enviar e-mail"
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContactOption({
  icon,
  iconClassName,
  title,
  value,
  copyValue,
  href,
  external = false,
  action,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  value: string;
  copyValue: string;
  href: string;
  external?: boolean;
  action: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-surface pr-1.5 transition-colors has-[a:hover]:bg-muted/60">
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={`${action}: ${value}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-3 pl-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${iconClassName}`}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          <span className="truncate text-[13px] text-ink-2 tabular-nums">
            {value}
          </span>
        </span>
      </a>
      <CopyButton value={copyValue} label={title} />
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copiado" : `Copiar ${label}`}
      title={copied ? "Copiado" : "Copiar"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard blocked: the value is on screen to copy by hand.
        }
      }}
      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-3 outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {copied ? (
        <Check className="size-4 text-success" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}
