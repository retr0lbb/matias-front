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
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const user = {
  name: "Henrique Barbosa",
  email: "retr0lbb@gmail.com",
  initials: "HB",
  plan: "Gratuito",
};

function AccountMenuItem({
  icon: Icon,
  label,
  aside,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  aside?: ReactNode;
  iconClassName?: string;
}) {
  return (
    <DropdownMenuItem className="h-9 cursor-pointer gap-2.5 rounded-lg px-2.5 text-sm text-foreground focus:bg-muted">
      <Icon className={cn("size-4 text-ink-2!", iconClassName)} />
      <span className="flex-1 text-foreground!">{label}</span>
      {aside}
    </DropdownMenuItem>
  );
}

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  return (
    <DropdownMenu>
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
          <span className="flex h-5.5 items-center rounded-full bg-secondary px-2 text-xs font-medium">
            {user.plan}
          </span>
        </div>

        <DropdownMenuSeparator className="mx-1 my-1" />

        <AccountMenuItem
          icon={Settings}
          label="Configurações da conta"
          aside={<span className="text-xs text-muted-foreground!">Ctrl ,</span>}
        />
        <AccountMenuItem
          icon={Gauge}
          label="Uso e limites"
          aside={
            <span className="text-xs text-muted-foreground!">18/30 hoje</span>
          }
        />
        <AccountMenuItem
          icon={Sparkles}
          label="Planos"
          iconClassName="text-brand!"
          aside={
            <span className="text-xs font-medium text-destructive!">
              Fazer upgrade
            </span>
          }
        />

        <DropdownMenuSeparator className="mx-1 my-1" />

        <AccountMenuItem icon={LifeBuoy} label="Central de ajuda" />
        <AccountMenuItem icon={LogOut} label="Sair" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
