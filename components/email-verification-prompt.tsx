"use client";

import { MailWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "./ui/alert-dialog";

/** Opened by the API client when a route needs a verified e-mail (403). */
export function EmailVerificationPrompt() {
  const router = useRouter();
  const open = useAuthStore((s) => s.verificationPromptOpen);
  const close = useAuthStore((s) => s.closeVerificationPrompt);

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <MailWarning />
          </AlertDialogMedia>
          <AlertDialogTitle>Confirme seu e-mail</AlertDialogTitle>
          <AlertDialogDescription>
            Para usar este recurso, você precisa confirmar seu e-mail. Abra o
            link que enviamos ou peça um novo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Agora não</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              close();
              router.push("/check-email");
            }}
          >
            Confirmar e-mail
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
