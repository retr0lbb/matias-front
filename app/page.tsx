import { CategoryItem } from "@/components/category-item";
import { ChatSideBarItems } from "@/components/chat-sidebar-items";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  Settings2,
  ChevronDown,
  MessageCircleDashed,
} from "lucide-react";

export default function Home() {
  return (
    <div className="w-screen h-screen flex items-center justify-center gap-2">
      <nav
        className="h-screen w-1/4 bg-zinc-200 rounded-tr-lg 
        rounded-br-lg flex flex-col"
      >
        <header className="w-full flex items-center justify-between px-2 py-2.5">
          <Settings2
            className="cursor-pointer text-zinc-400 
          hover:text-zinc-800 transition-all"
            strokeWidth={1.2}
            size={24}
          />
          <ChevronLeft
            className="cursor-pointer text-zinc-400 
          hover:text-zinc-800 transition-all"
            strokeWidth={1}
          />
        </header>

        <ScrollArea className="flex w-full p-2 whitespace-nowrap">
          <div className="flex w-max space-x-2">
            <CategoryItem text="Tudo +99" isSelected />
            <CategoryItem text="Provas 12" />
            <CategoryItem text="Documentos 29" />
            <CategoryItem text="Rubricas 81" />
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex flex-col gap-2 my-2.5 px-2">
          <Button variant={"default"} size={"sm"} className={"rounded-full"}>
            <MessageCircleDashed />
            Nova Conversa
          </Button>
        </div>

        {/** CONVERSATION_SECTION */}
        <Collapsible
          defaultOpen={true}
          className="flex flex-col flex-1 py-1 px-2 items-start"
        >
          <CollapsibleTrigger className="group flex items-center justify-center gap-0.5 text-sm cursor-pointer">
            Minhas Conversas
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>

          <CollapsibleContent className="w-full">
            <div className="flex w-full flex-col gap-1.5 mt-2 px-2">
              <ChatSideBarItems text="O que significa Farmar Aura" />

              <ChatSideBarItems text="A correlação entre o Iluminismo e a queda do muro de Berlim em 1940" />

              <ChatSideBarItems text="Ideias de aula GenZ Com Aura" />

              <ChatSideBarItems text="Atividade Avaliativa Historia 2026 tema Guerra Fria" />

              <ChatSideBarItems text="Jogos Matematicos e Estatisticos para 6 ano" />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </nav>

      <div className="flex flex-1 w-full h-full bg-zinc-950"></div>
    </div>
  );
}
