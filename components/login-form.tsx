"use client";

import { AtSign, CircleAlert, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getMe, googleLoginUrl, login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { isEmail } from "@/lib/validation";
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

type Errors = { email?: string; password?: string };

function validate(email: string, password: string): Errors {
  const errors: Errors = {};
  if (!email.trim()) errors.email = "Informe seu e-mail.";
  else if (!isEmail(email)) errors.email = "Informe um e-mail válido.";
  if (!password) errors.password = "Informe sua senha.";
  return errors;
}

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    // 404 is "User not found"; show the same message so we don't reveal
    // which e-mails have an account.
    if (error.status === 401 || error.status === 404) {
      return "E-mail ou senha incorretos.";
    }
    if (error.status < 500) return error.message;
  }
  return "Não foi possível entrar agora. Tente novamente.";
}

const inputGroupClass =
  "h-9 bg-card has-[[data-slot][aria-invalid=true]]:ring-0";

export function LoginForm() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const ids = { email: useId(), password: useId(), remember: useId() };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Errors only show after the first submit attempt, then update live.
  const errors = submitted ? validate(email, password) : {};

  function signInWithGoogle() {
    window.location.assign(googleLoginUrl(`${window.location.origin}/`));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (pending || Object.keys(validate(email, password)).length > 0) return;

    setPending(true);
    setFormError(null);
    try {
      const { mfaRequired } = await login({ email: email.trim(), password });
      if (mfaRequired) {
        setFormError(
          "Sua conta usa verificação em duas etapas, que ainda não está disponível aqui.",
        );
        return;
      }
      signIn(await getMe(), remember);
      router.push("/");
    } catch (error) {
      setFormError(loginErrorMessage(error));
    } finally {
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
          Entre na sua conta
        </h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Use sua conta Google da escola ou seu e-mail e senha.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={signInWithGoogle}
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
            htmlFor={ids.email}
            className={cn(errors.email && "text-destructive")}
          >
            E-mail
          </Label>
          <InputGroup className={inputGroupClass}>
            <InputGroupAddon>
              <AtSign
                className={cn(
                  "size-4",
                  errors.email ? "text-destructive" : "text-muted-foreground",
                )}
              />
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
          <div className="flex items-center justify-between">
            <Label
              htmlFor={ids.password}
              className={cn(errors.password && "text-destructive")}
            >
              Senha
            </Label>
            <button
              type="button"
              className="cursor-pointer text-[13px] font-medium hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>
          <InputGroup className={inputGroupClass}>
            <InputGroupAddon>
              <LockKeyhole
                className={cn(
                  "size-4",
                  errors.password
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              />
            </InputGroupAddon>
            <InputGroupInput
              id={ids.password}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
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
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="flex justify-center gap-1.5 text-[13px] text-muted-foreground">
        Ainda não tem conta?
        <Link
          href="/register"
          className="font-medium text-foreground hover:underline"
        >
          Criar conta de professor
        </Link>
      </p>
    </form>
  );
}
