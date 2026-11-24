"use client";

import {
  AtSign,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { googleLoginUrl, register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { isEmail } from "@/lib/validation";
import { markVerificationSent } from "@/lib/verification-cooldown";
import { useAuthStore } from "@/stores/auth-store";
import { GoogleIcon } from "./google-icon";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { Label } from "./ui/label";

type Fields = { name: string; email: string; password: string };
type Errors = Partial<Record<keyof Fields, string>>;

const MIN_PASSWORD_LENGTH = 8;

function validate({ name, email, password }: Fields): Errors {
  const errors: Errors = {};
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length === 0) errors.name = "Informe seu nome completo.";
  else if (nameParts.length < 2) errors.name = "Informe nome e sobrenome.";

  if (!email.trim()) errors.email = "Informe seu e-mail.";
  else if (!isEmail(email)) errors.email = "Informe um e-mail válido.";

  if (!password) errors.password = "Crie uma senha.";
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;

  return errors;
}

function registerErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Já existe uma conta com este e-mail.";
    if (error.status < 500) return error.message;
  }
  return "Não foi possível criar sua conta agora. Tente novamente.";
}

const inputGroupClass =
  "h-9 bg-card has-[[data-slot][aria-invalid=true]]:ring-0";

function iconClass(hasError: boolean) {
  return cn("size-4", hasError ? "text-destructive" : "text-muted-foreground");
}

export function RegisterForm() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const ids = {
    name: useId(),
    email: useId(),
    password: useId(),
    remember: useId(),
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Errors only show after the first submit attempt, then update live.
  const errors = submitted ? validate({ name, email, password }) : {};

  function signUpWithGoogle() {
    window.location.assign(googleLoginUrl(`${window.location.origin}/`));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    const fields = { name, email, password };
    if (pending || Object.keys(validate(fields)).length > 0) return;

    setPending(true);
    setFormError(null);
    try {
      // Register also sets the session cookie and sends the verification e-mail.
      const user = await register({
        name: name.trim().replace(/\s+/g, " "),
        email: email.trim(),
        password,
      });
      signIn(user, remember);
      markVerificationSent();
      router.push("/check-email");
    } catch (error) {
      setFormError(registerErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full max-w-95 flex-col gap-5.5"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[34px] leading-tight tracking-[-0.02em]">
          Crie sua conta
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Use sua conta Google da escola ou cadastre-se com seu e-mail.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={signUpWithGoogle}
        className="h-10 gap-2 bg-card"
      >
        <GoogleIcon className="size-4.25" />
        Continuar com Google
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={ids.name}
            className={cn(errors.name && "text-destructive")}
          >
            Nome completo
          </Label>
          <InputGroup className={inputGroupClass}>
            <InputGroupAddon>
              <UserRound className={iconClass(Boolean(errors.name))} />
            </InputGroupAddon>
            <InputGroupInput
              id={ids.name}
              name="name"
              autoComplete="name"
              placeholder="Seu nome e sobrenome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${ids.name}-error` : undefined}
            />
            {errors.name && (
              <InputGroupAddon align="inline-end">
                <CircleAlert className="size-4 text-destructive" />
              </InputGroupAddon>
            )}
          </InputGroup>
          {errors.name && (
            <p
              id={`${ids.name}-error`}
              className="text-[13px] text-destructive"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor={ids.email}
            className={cn(errors.email && "text-destructive")}
          >
            E-mail
          </Label>
          <InputGroup className={inputGroupClass}>
            <InputGroupAddon>
              <AtSign className={iconClass(Boolean(errors.email))} />
            </InputGroupAddon>
            <InputGroupInput
              id={ids.email}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nome@escola.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${ids.email}-error` : undefined}
            />
            {errors.email && (
              <InputGroupAddon align="inline-end">
                <CircleAlert className="size-4 text-destructive" />
              </InputGroupAddon>
            )}
          </InputGroup>
          {errors.email && (
            <p
              id={`${ids.email}-error`}
              className="text-[13px] text-destructive"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor={ids.password}
            className={cn(errors.password && "text-destructive")}
          >
            Senha
          </Label>
          <InputGroup className={inputGroupClass}>
            <InputGroupAddon>
              <LockKeyhole className={iconClass(Boolean(errors.password))} />
            </InputGroupAddon>
            <InputGroupInput
              id={ids.password}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? `${ids.password}-error` : undefined
              }
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.password && (
            <p
              id={`${ids.password}-error`}
              className="text-[13px] text-destructive"
            >
              {errors.password}
            </p>
          )}
        </div>
      </div>

      <Label
        htmlFor={ids.remember}
        className="w-fit cursor-pointer text-[13px] font-normal text-ink-2"
      >
        <Checkbox
          id={ids.remember}
          checked={remember}
          onCheckedChange={setRemember}
        />
        Manter conectado neste computador
      </Label>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="h-10" disabled={pending}>
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="flex justify-center gap-1.5 text-[13px] text-muted-foreground">
        Já tem uma conta?
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
