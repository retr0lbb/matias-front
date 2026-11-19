"use client";

import { AtSign, CircleAlert, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { createFakeHostId, useAuthStore } from "@/stores/auth-store";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { Label } from "./ui/label";

type Errors = { identifier?: string; password?: string };

// Test mode: the local strategy accepts any username/e-mail and password.
// Only empty fields are rejected. Replace with the real auth call later.
function validate(identifier: string, password: string): Errors {
  const errors: Errors = {};
  if (!identifier.trim()) errors.identifier = "Informe seu usuário ou e-mail.";
  if (!password) errors.password = "Informe sua senha.";
  return errors;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

const inputGroupClass =
  "h-9 bg-card has-[[data-slot][aria-invalid=true]]:ring-0";

export function LoginForm() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const ids = { identifier: useId(), password: useId(), remember: useId() };

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Errors only show after the first submit attempt, then update live.
  const errors = submitted ? validate(identifier, password) : {};

  function finishSignIn() {
    signIn(createFakeHostId(), remember);
    router.push("/");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    const result = validate(identifier, password);
    if (Object.keys(result).length === 0) finishSignIn();
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
          Use sua conta Google da escola ou seu usuário e senha.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={finishSignIn}
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
            htmlFor={ids.identifier}
            className={cn(errors.identifier && "text-destructive")}
          >
            Usuário ou e-mail
          </Label>
          <InputGroup className={inputGroupClass}>
            <InputGroupAddon>
              <AtSign
                className={cn(
                  "size-4",
                  errors.identifier
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              />
            </InputGroupAddon>
            <InputGroupInput
              id={ids.identifier}
              name="identifier"
              autoComplete="username"
              placeholder="nome@escola.edu.br"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={
                errors.identifier ? `${ids.identifier}-error` : undefined
              }
            />
            {errors.identifier && (
              <InputGroupAddon align="inline-end">
                <CircleAlert className="size-4 text-destructive" />
              </InputGroupAddon>
            )}
          </InputGroup>
          {errors.identifier && (
            <p
              id={`${ids.identifier}-error`}
              className="text-[13px] text-destructive"
            >
              {errors.identifier}
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

      <Button type="submit" className="h-10">
        Entrar
      </Button>

      <p className="flex justify-center gap-1.5 text-[13px] text-muted-foreground">
        Ainda não tem conta?
        <button
          type="button"
          className="cursor-pointer font-medium text-foreground hover:underline"
        >
          Criar conta de professor
        </button>
      </p>
    </form>
  );
}
