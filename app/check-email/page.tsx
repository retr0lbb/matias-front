import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { CheckEmail } from "@/components/check-email";

export const metadata: Metadata = {
  title: "Confira seu e-mail — MATIAS",
};

export default function CheckEmailPage() {
  return (
    <AuthShell access="authenticated">
      <CheckEmail />
    </AuthShell>
  );
}
