import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex min-w-0 flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
