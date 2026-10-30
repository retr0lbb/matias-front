import { Sidebar } from "@/components/sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen flex items-center justify-center gap-2">
      <Sidebar />
      {children}
    </div>
  );
}
