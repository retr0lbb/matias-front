import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { PlansView } from "@/components/plans/plans-view";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Planos — MATIAS",
};

export default function PlansPage() {
  return (
    <AuthGuard>
      <div className="flex h-dvh w-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <PlansView />
        </main>
      </div>
    </AuthGuard>
  );
}
