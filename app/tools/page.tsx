import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { ToolsView } from "@/components/tools/tools-view";

export const metadata: Metadata = {
  title: "Ferramentas — MATIAS",
};

export default function ToolsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <ToolsView />
        </main>
      </div>
    </AuthGuard>
  );
}
