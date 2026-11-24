"use client";

import {
  ChevronsUpDown,
  Gauge,
  LifeBuoy,
  LogOut,
  type LucideIcon,
  Settings,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { logout } from "@/lib/api/auth";
import { anyLimitReached, planName, resetsInLabel } from "@/lib/usage-format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUsageStore } from "@/stores/usage-store";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { UsageDialog } from "./usage-dialog";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function AccountMenuItem({
  icon: Icon,
  label,
  aside,
  iconClassName,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  aside?: ReactNode;
  iconClassName?: string;
  onClick?: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className="h-9 cursor-pointer gap-2.5 rounded-lg px-2.5 text-sm text-foreground focus:bg-muted"
    >
      <Icon className={cn("size-4 text-ink-2!", iconClassName)} />
      <span className="flex-1 text-foreground!">{label}</span>
      {aside}
    </DropdownMenuItem>
  );
}

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const sessionUser = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.signOut);
  const usage = useUsageStore((s) => s.usage);
  const loadUsage = useUsageStore((s) => s.load);
  const [usageOpen, setUsageOpen] = useState(false);
  const user = {
    name: sessionUser?.name ?? "",
    email: sessionUser?.email ?? "",
    initials: initialsOf(sessionUser?.name ?? ""),
  };
  const limitReached = usage ? anyLimitReached(usage) : false;

  // Ctrl+, (Cmd+, on Mac) opens the settings, as the menu item shows.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "," && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        router.push("/settings");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);
  const resetsIn = usage ? resetsInLabel(usage.cycle.resetsAt) : null;

  async function signOut() {
    try {
      await logout();
    } catch {
      // Still sign out locally; the session expires on the server anyway.
    }
    clearSession();
    router.push("/login");
  }

  return (
    <>
      <DropdownMenu
        // Usage changes with every message, so refresh it on each open.
        onOpenChange={(open) => {
          if (open) loadUsage();
        }}
      >
        {compact ? (
          <DropdownMenuTrigger
            aria-label="Conta"
            title={user.name}
            className="cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:ring-3 data-popup-open:ring-ring/20"
          >
            <Avatar className="size-8 after:border-0">
              <AvatarFallback className="bg-[#2b2722] text-xs font-semibold text-primary-foreground">
                {user.initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        ) : (
          <DropdownMenuTrigger className="flex h-14 w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border bg-surface px-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-input data-popup-open:bg-accent">
            <Avatar className="size-8.5 after:border-0">
              <AvatarFallback className="bg-[#2b2722] text-[13px] font-semibold text-primary-foreground">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-ink-3">{user.email}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-ink-3" />
          </DropdownMenuTrigger>
        )}

        <DropdownMenuContent
          side={compact ? "right" : "top"}
          align={compact ? "end" : "start"}
          sideOffset={compact ? 14 : 8}
          className={cn(
            "rounded-xl p-1.5 shadow-[0_12px_32px_#1c1a1726] ring-border",
            compact && "w-66",
          )}
        >
          <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            {usage && (
              <span className="flex h-5.5 items-center rounded-full bg-secondary px-2 text-xs font-medium">
                {planName(usage.plan)}
              </span>
            )}
          </div>

          <DropdownMenuSeparator className="mx-1 my-1" />

          <AccountMenuItem
            icon={Settings}
            label="Configurações da conta"
            onClick={() => router.push("/settings")}
            aside={
              <span className="text-xs text-muted-foreground!">Ctrl ,</span>
            }
          />
          <AccountMenuItem
            icon={Gauge}
            label="Uso e limites"
            onClick={() => setUsageOpen(true)}
            aside={
              limitReached ? (
                <span className="text-xs font-medium text-brand!">
                  Limite atingido
                </span>
              ) : resetsIn ? (
                <span className="text-xs text-muted-foreground!">
                  {resetsIn}
                </span>
              ) : null
            }
          />
          <AccountMenuItem
            icon={Sparkles}
            label="Planos"
            iconClassName="text-brand!"
            onClick={() => router.push("/plans")}
            aside={
              // Only free accounts have something to upgrade to.
              usage?.plan.slug === "free" ? (
                <span className="text-xs font-medium text-destructive!">
                  Fazer upgrade
                </span>
              ) : null
            }
          />

          <DropdownMenuSeparator className="mx-1 my-1" />

          <AccountMenuItem icon={LifeBuoy} label="Central de ajuda" />
          <AccountMenuItem icon={LogOut} label="Sair" onClick={signOut} />
        </DropdownMenuContent>
      </DropdownMenu>
      <UsageDialog open={usageOpen} onOpenChange={setUsageOpen} />
    </>
  );
}
