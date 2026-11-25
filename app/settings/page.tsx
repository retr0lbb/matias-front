import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { SettingsView } from "@/components/settings/settings-view";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Configurações — MATIAS",
};

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="flex h-dvh w-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <SettingsView />
        </main>
      </div>
    </AuthGuard>
  );
}
