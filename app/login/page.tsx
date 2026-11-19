import type { Metadata } from "next";
import Image from "next/image";
import { AuthGuard } from "@/components/auth-guard";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar — MATIAS",
};

const PHOTO_URL =
  "https://images.unsplash.com/photo-1566827886142-75787ba140a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex w-full flex-col px-6 py-9 sm:px-14 lg:w-160 lg:shrink-0">
        <span className="font-brand text-[26px] font-black italic tracking-[-0.02em]">
          MAT<span className="text-brand">IA</span>S
        </span>

        <main className="flex flex-1 items-center justify-center py-10">
          <AuthGuard require="guest">
            <LoginForm />
          </AuthGuard>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 MATIAS</span>
          <nav className="flex gap-4">
            {["Termos de uso", "Privacidade", "Ajuda"].map((label) => (
              <button
                key={label}
                type="button"
                className="cursor-pointer hover:text-foreground"
              >
                {label}
              </button>
            ))}
          </nav>
        </footer>
      </div>

      <div className="hidden flex-1 p-4 lg:flex">
        <div className="relative flex-1 overflow-hidden rounded-2xl">
          <Image
            src={PHOTO_URL}
            alt="Garrafa de vidro sobre uma pilha de livros em uma mesa de madeira"
            fill
            preload
            sizes="(min-width: 1024px) 60vw, 0px"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
