import { CategoryItem } from "@/components/category-item";
import { ChevronLeft, Settings, ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <div className="w-screen h-screen flex items-center justify-center gap-2">
      <nav
        className="h-screen w-1/4 bg-zinc-200 rounded-tr-lg 
        rounded-br-lg flex flex-col"
      >
        <header className="w-full flex items-center justify-between px-2 py-2.5">
          <Settings
            className="cursor-pointer text-zinc-400 
          hover:text-zinc-800 transition-all"
          />
          <ChevronLeft
            className="cursor-pointer text-zinc-400 
          hover:text-zinc-800 transition-all"
          />
        </header>

        <div className="flex w-full p-2 flex-nowrap overflow-x-hidden gap-2">
          <CategoryItem text="Tudo +99" isSelected />
          <CategoryItem text="Provas 12" />
          <CategoryItem text="Documentos 29" />
          <CategoryItem text="Rubricas 81" />
        </div>

        <div className="flex flex-col flex-1 p-1">
          <div className="flex items-center justify-between px-2">
            <span className="flex items-center justify-center gap-0.5 text-sm">
              Chats <ChevronDown></ChevronDown>
            </span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 w-full h-full bg-zinc-950"></div>
    </div>
  );
}
