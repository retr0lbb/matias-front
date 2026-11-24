"use client";

import { cn } from "cn";
import {
  CircleCheck,
  CreditCard,
  LoaderCircle,
  type LucideIcon,
  QrCode,
} from "lucide-react";
import { type FormEvent, useEffect, useId, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  type PaymentMethod,
  type Plan,
  paymentUrlFrom,
  subscribe,
} from "@/lib/api/subscription";
import { formatPrice, intervalLabel } from "@/lib/plans";
import { planName } from "@/lib/usage-format";
import { cpfDigits, formatCpf, isCpf } from "@/lib/validation";
import { useAuthStore } from "@/stores/auth-store";
import { useUsageStore } from "@/stores/usage-store";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const METHODS: { id: PaymentMethod; label: string; icon: LucideIcon }[] = [
  { id: "PIX", label: "Pix", icon: QrCode },
  { id: "CREDIT_CARD", label: "Cartão de crédito", icon: CreditCard },
];

type Errors = Partial<Record<"fullName" | "cpf" | "form", string>>;

function submitError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "EMAIL_NOT_VERIFIED") {
      return "Confirme seu e-mail antes de assinar.";
    }
    if (error.status === 409) return "Você já tem uma assinatura ativa.";
    if (error.status < 500) return error.message;
  }
  return "Não foi possível iniciar a assinatura. Tente novamente.";
}

/** Collects what `POST /subscription` needs and starts the subscription. */
export function CheckoutDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const userName = useAuthStore((s) => s.user?.name ?? "");
  const loadUsage = useUsageStore((s) => s.load);
  const [fullName, setFullName] = useState(userName);
  const [cpf, setCpf] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [discountCode, setDiscountCode] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "redirecting" | "done"
  >("idle");
  const ids = { name: useId(), cpf: useId(), discount: useId() };

  // Each opening starts from a clean form (keeping what was typed is fine,
  // but not a previous error or success screen).
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setStatus("idle");
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (fullName.trim().split(/\s+/).length < 2) {
      next.fullName = "Informe seu nome completo.";
    }
    if (!isCpf(cpf)) next.cpf = "CPF inválido.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const result = await subscribe({
        planId: plan.id,
        paymentMethod: method,
        fullName: fullName.trim(),
        cpf: cpfDigits(cpf),
        discountCode: discountCode.trim() || undefined,
      });
      const url = paymentUrlFrom(result);
      if (url) {
        setStatus("redirecting");
        window.location.assign(url);
        return;
      }
      setStatus("done");
      loadUsage();
    } catch (error) {
      setStatus("idle");
      setErrors({ form: submitError(error) });
    }
  }

  const busy = status === "sending" || status === "redirecting";
  const price = `${formatPrice(plan.price, plan.currency)}/${intervalLabel(plan.billing_interval)}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        {status === "done" ? (
          <>
            <DialogHeader className="items-center pr-0 text-center">
              <CircleCheck className="mb-1 size-10 text-success" />
              <DialogTitle>Assinatura iniciada</DialogTitle>
              <DialogDescription>
                Assim que o pagamento for confirmado, seu plano muda para{" "}
                {planName(plan)}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button className="w-full sm:w-auto" />}>
                Entendi
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Assinar o {planName(plan)}</DialogTitle>
              <DialogDescription>
                {price}. Preencha seus dados para continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <Field
                id={ids.name}
                label="Nome completo"
                error={errors.fullName}
              >
                <Input
                  id={ids.name}
                  value={fullName}
                  autoComplete="name"
                  disabled={busy}
                  aria-invalid={errors.fullName ? true : undefined}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-lg bg-surface"
                />
              </Field>

              <Field id={ids.cpf} label="CPF" error={errors.cpf}>
                <Input
                  id={ids.cpf}
                  value={cpf}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  disabled={busy}
                  aria-invalid={errors.cpf ? true : undefined}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  className="h-10 rounded-lg bg-surface tabular-nums"
                />
              </Field>

              <fieldset className="grid gap-2" disabled={busy}>
                <legend className="mb-2 text-sm font-medium">
                  Forma de pagamento
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(({ id, label, icon: Icon }) => (
                    <label
                      key={id}
                      className={cn(
                        "flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-input bg-surface px-3 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-60",
                        method === id
                          ? "border-foreground font-medium"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={id}
                        checked={method === id}
                        onChange={() => setMethod(id)}
                        className="sr-only"
                      />
                      <Icon className="size-4 text-ink-2" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {showDiscount ? (
                <Field id={ids.discount} label="Cupom de desconto">
                  <Input
                    id={ids.discount}
                    value={discountCode}
                    autoFocus
                    disabled={busy}
                    autoCapitalize="characters"
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="h-10 rounded-lg bg-surface uppercase"
                  />
                </Field>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDiscount(true)}
                  className="w-fit cursor-pointer text-[13px] font-medium text-ink-2 underline-offset-2 hover:text-foreground hover:underline"
                >
                  Tenho um cupom de desconto
                </button>
              )}

              {errors.form && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.form}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose
                disabled={busy}
                render={<Button type="button" variant="outline" />}
              >
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={busy} className="gap-2">
                {busy && (
                  <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                )}
                {status === "redirecting"
                  ? "Abrindo o pagamento…"
                  : status === "sending"
                    ? "Enviando…"
                    : `Assinar por ${price}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
