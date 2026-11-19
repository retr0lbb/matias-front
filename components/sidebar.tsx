"use client";

import {
  FolderOpen,
  GraduationCap,
  LayoutTemplate,
  type LucideIcon,
  PanelLeft,
  Search,
  SquarePen,
  Wrench,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { AccountMenu } from "./account-menu";
import { ChatSideBarItems } from "./chat-sidebar-items";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

const navItems: { label: string; icon: LucideIcon; trailing?: ReactNode }[] = [
  { label: "Ferramentas", icon: Wrench },
  { label: "Modelos", icon: LayoutTemplate },
  {
    label: "Meus arquivos",
    icon: FolderOpen,
    trailing: <span className="text-xs text-ink-3">38</span>,
  },
  {
    label: "Google Classroom",
    icon: GraduationCap,
    trailing: (
      <span className="flex items-center gap-1.5 text-xs text-ink-3">
        <span className="size-1.75 rounded-full bg-success" />
        Conectado
      </span>
    ),
  },
];

const conversationGroups = [
  {
    label: "Hoje",
    items: ["O que significa farmar aura", "Iluminismo e o Muro de Berlim"],
  },
  {
    label: "Últimos 7 dias",
    items: [
      "Ideias de aula Gen Z com aura",
      "Prova de História: Guerra Fria",
      "Jogos de matemática — 6º ano",
    ],
  },
  {
    label: "Outubro",
    items: [
      "Rubrica de redação dissertativa",
      "Sequência didática: frações",
      "Revisão do simulado — 3º ano",
    ],
  },
];

const railItems: { label: string; icon: LucideIcon }[] = [
  { label: "Nova conversa", icon: SquarePen },
  { label: "Buscar conversas", icon: Search },
  { label: "Meus arquivos", icon: FolderOpen },
  { label: "Google Classroom", icon: GraduationCap },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return <SidebarRail onExpand={() => setCollapsed(false)} />;
  }

  return <SidebarPanel onCollapse={() => setCollapsed(true)} />;
}

function RailButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
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

      <Button className="h-10 justify-between rounded-[10px] pr-3 pl-3.5 font-medium">
        <span className="flex items-center gap-2.5">
          <SquarePen />
          Nova conversa
        </span>
        <kbd className="rounded-[5px] bg-white/12 px-1.5 py-0.5 font-sans text-[11px] font-normal text-primary-foreground/70">
          Ctrl K
        </kbd>
      </Button>

      <div className="flex flex-col gap-0.5 pt-2.5">
        {navItems.map(({ label, icon: Icon, trailing }) => (
          <Button
            key={label}
            variant="ghost"
            className="h-9 justify-between rounded-lg px-2.5 font-normal hover:bg-accent"
          >
            <span className="flex items-center gap-2.5">
              <Icon className="size-4.25 text-ink-2" />
              {label}
            </span>
            {trailing}
          </Button>
        ))}
      </div>

      <ScrollArea className="mt-3.5 min-h-0 flex-1">
        <div className="flex flex-col gap-0.5">
          {conversationGroups.map((group, groupIndex) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p
                className={`px-2.5 pb-1.5 text-xs font-medium text-ink-3 ${groupIndex === 0 ? "pt-0.5" : "pt-3.5"}`}
              >
                {group.label}
              </p>
              {group.items.map((title, i) => (
                <ChatSideBarItems
                  key={title}
                  text={title}
                  isSelected={groupIndex === 0 && i === 0}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      <AccountMenu />
    </nav>
  );
}
