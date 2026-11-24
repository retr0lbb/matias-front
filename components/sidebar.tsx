"use client";

import {
  GraduationCap,
  type LucideIcon,
  PanelLeft,
  Search,
  SquarePen,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import { useRefreshUser } from "@/hooks/use-refresh-user";
import { useClassroomStore } from "@/stores/classroom-store";
import { useUiStore } from "@/stores/ui-store";
import { AccountMenu } from "./account-menu";
import { ConversationList } from "./conversation-list";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

const CLASSROOM_HREF = "/settings#classroom";

const navItems: {
  label: string;
  icon: LucideIcon;
  href?: string;
  trailing?: ReactNode;
}[] = [{ label: "Ferramentas", icon: Wrench, href: "/tools" }];

const railItems: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Nova conversa", icon: SquarePen },
  { label: "Buscar conversas", icon: Search },
  { label: "Ferramentas", icon: Wrench, href: "/tools" },
];

/** Loads the Classroom connection once per user for the sidebar status. */
function useClassroomStatus() {
  const status = useClassroomStore((s) => s.status);
  const loading = useClassroomStore((s) => s.loading);
  const load = useClassroomStore((s) => s.load);
  useEffect(() => {
    if (loading === "idle") load();
  }, [loading, load]);
  return status;
}

function ClassroomNavItem() {
  const status = useClassroomStatus();
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link href={CLASSROOM_HREF} />}
      className="h-9 justify-between rounded-lg px-2.5 font-normal hover:bg-accent"
    >
      <span className="flex items-center gap-2.5">
        <GraduationCap className="size-4.25 text-ink-2" />
        Google Classroom
      </span>
      {status && (
        <span className="flex items-center gap-1.5 text-xs text-ink-3">
          <span
            className={
              status.connected
                ? "size-1.75 rounded-full bg-success"
                : "size-1.75 rounded-full bg-ink-3/50"
            }
          />
          {status.connected ? "Conectado" : "Desconectado"}
        </span>
      )}
    </Button>
  );
}

function ClassroomRailButton() {
  const status = useClassroomStatus();
  const label = status
    ? `Google Classroom (${status.connected ? "conectado" : "desconectado"})`
    : "Google Classroom";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      nativeButton={false}
      render={<Link href={CLASSROOM_HREF} />}
      className="relative rounded-lg text-ink-2 hover:bg-accent"
    >
      <GraduationCap className="size-4.5" />
      {status?.connected && (
        <span className="absolute right-1.5 bottom-1.5 size-1.75 rounded-full bg-success ring-2 ring-sidebar" />
      )}
    </Button>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  useRefreshUser();

  if (collapsed) {
    return <SidebarRail onExpand={() => setCollapsed(false)} />;
  }

  return <SidebarPanel onCollapse={() => setCollapsed(true)} />;
}

function RailButton({
  label,
  icon: Icon,
  href,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      {...(href
        ? { nativeButton: false, render: <Link href={href} /> }
        : undefined)}
      className="rounded-lg text-ink-2 hover:bg-accent"
    >
      <Icon className="size-4.5" />
    </Button>
  );
}

function SidebarRail({ onExpand }: { onExpand: () => void }) {
  return (
    <nav className="flex h-screen w-15 shrink-0 flex-col items-center gap-1.5 border-r border-sidebar-border bg-sidebar py-3.5 text-sidebar-foreground">
      <span
        title="MATIAS"
        className="flex size-9 items-center justify-center font-brand text-[22px] font-black italic"
      >
        M
      </span>
      <div className="h-2" />
      <RailButton
        label="Expandir barra lateral"
        icon={PanelLeft}
        onClick={onExpand}
      />
      {railItems.map((item) => (
        <RailButton key={item.label} {...item} />
      ))}
      <ClassroomRailButton />
      <div className="flex-1" />
      <AccountMenu compact />
    </nav>
  );
}

function SidebarPanel({ onCollapse }: { onCollapse: () => void }) {
  return (
    <nav className="flex h-screen w-72 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar px-3 py-3.5 text-sidebar-foreground">
      <header className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Recolher barra lateral"
          title="Recolher barra lateral"
          onClick={onCollapse}
          className="text-ink-2 hover:bg-accent"
        >
          <PanelLeft className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Buscar conversas"
          className="text-ink-2 hover:bg-accent"
        >
          <Search className="size-4.5" />
        </Button>
      </header>

      <div className="flex flex-col gap-0.5 px-2 pt-2.5 pb-4.5">
        <h1 className="font-brand text-3xl font-black italic tracking-[-0.02em]">
          MAT<span className="text-brand">IA</span>S
        </h1>
        <p className="font-serif text-sm italic text-ink-2">AI Educacional</p>
      </div>

      <Button
        nativeButton={false}
        render={<Link href="/" />}
        className="h-10 justify-between rounded-[10px] pr-3 pl-3.5 font-medium"
      >
        <span className="flex items-center gap-2.5">
          <SquarePen />
          Nova conversa
        </span>
        <kbd className="rounded-[5px] bg-white/12 px-1.5 py-0.5 font-sans text-[11px] font-normal text-primary-foreground/70">
          Ctrl K
        </kbd>
      </Button>

      <div className="flex flex-col gap-0.5 pt-2.5">
        {navItems.map(({ label, icon: Icon, href, trailing }) => (
          <Button
            key={label}
            variant="ghost"
            {...(href
              ? { nativeButton: false, render: <Link href={href} /> }
              : undefined)}
            className="h-9 justify-between rounded-lg px-2.5 font-normal hover:bg-accent"
          >
            <span className="flex items-center gap-2.5">
              <Icon className="size-4.25 text-ink-2" />
              {label}
            </span>
            {trailing}
          </Button>
        ))}
        <ClassroomNavItem />
      </div>

      <ScrollArea className="mt-3.5 min-h-0 flex-1">
        <p className="px-2.5 pt-0.5 pb-1.5 text-xs font-medium text-ink-3">
          Conversas
        </p>
        <ConversationList />
      </ScrollArea>

      <AccountMenu />
    </nav>
  );
}
