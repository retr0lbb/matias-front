import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmail } from "@/components/verify-email";

export const metadata: Metadata = {
  title: "Confirmar e-mail — MATIAS",
};

// Public: the link may be opened in a browser where the user isn't signed in.
export default function VerifyEmailPage() {
  return (
    <AuthShell access="public">
      {/* useSearchParams reads ?token=, so it renders below a Suspense boundary. */}
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
