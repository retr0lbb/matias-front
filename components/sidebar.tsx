import {
  Book,
  ChevronDown,
  ChevronsUpDown,
  MessageCircleDashed,
  PanelLeft,
  Ruler,
  Search,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";
import { ChatSideBarItems } from "./chat-sidebar-items";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function Sidebar() {
  return (
    <nav
      className="h-screen w-1/3 overflow-hidden bg-zinc-100 border-r border-zinc-950/20 rounded-tr-lg 
        rounded-br-lg flex flex-col"
    >
      <header className="w-full flex items-center justify-between px-2 py-2.5">
        <PanelLeft
          className="cursor-pointer text-zinc-400 
          hover:text-zinc-800 transition-all"
          strokeWidth={1}
        />
        <Search
          className="cursor-pointer text-zinc-400 
          hover:text-zinc-800 transition-all"
          strokeWidth={1.2}
          size={24}
        />
      </header>

      <div className="space-y-0.5 mb-4">
        <h1 className="text-4xl font-black w-full text-center text-zinc-800 italic">
          MAT<strong className="text-rose-600">IA</strong>S
        </h1>
        <p className="w-full text-center text-xs text-zinc-700">
          AI Educacional
        </p>
      </div>

      <div className="flex flex-col gap-2 my-2.5 px-2">
        <Button variant={"default"} size={"sm"} className={"rounded-full"}>
          <MessageCircleDashed />
          Nova Conversa
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          className={"rounded-full flex items-center justify-start font-normal"}
        >
          <Ruler strokeWidth={1} />
          Ferramentas
        </Button>{" "}
        <Button
          variant={"ghost"}
          size={"sm"}
          className={"rounded-full flex items-center justify-start font-normal"}
        >
          <Book />
          Modelos
        </Button>
      </div>

      <div className="w-7/8 m-auto rounded-full h-px bg-zinc-950/10"></div>

      {/** CONVERSATION_SECTION */}
      <Collapsible
        defaultOpen={true}
        className="flex min-h-0 flex-1 flex-col py-1 px-2 items-start mt-4"
      >
        <CollapsibleTrigger className="group flex shrink-0 items-center justify-center gap-0.5 text-sm cursor-pointer">
          Minhas Conversas
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="w-full min-h-0 flex-1">
          <ScrollArea className="h-full w-full mt-2 px-2">
            <div className="flex flex-col gap-1.5">
              <ChatSideBarItems text="O que significa Farmar Aura" isSelected />
              <ChatSideBarItems text="A correlação entre o Iluminismo e a queda do muro de Berlim em 1940" />
              <ChatSideBarItems text="Ideias de aula GenZ Com Aura" />
              <ChatSideBarItems text="Atividade Avaliativa Historia 2026 tema Guerra Fria" />
              <ChatSideBarItems text="Jogos Matematicos e Estatisticos para 6 ano" />
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      <div className="w-full flex items-center justify-center pb-4 pt-2 px-2">
        <div className="flex items-center gap-3 justify-center bg-zinc-950/5 py-2 px-6 rounded-full border border-zinc-950/20">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback> U </AvatarFallback>
          </Avatar>
          <div className="flex items-center flex-col justify-center">
            <p className="text-sm text-zinc-900">Henrique Barbosa</p>
            <p className="text-xs text-zinc-700">retr0lbb@gmail.com</p>
          </div>

          <ChevronsUpDown className="text-zinc-400" />
        </div>
      </div>
    </nav>
  );
}
