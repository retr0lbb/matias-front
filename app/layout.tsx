import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { EmailVerificationPrompt } from "@/components/email-verification-prompt";
import { StoreHydration } from "@/components/store-hydration";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "MATIAS — AI Educacional",
  description: "Assistente de IA para professores",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        newsreader.variable,
        archivo.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <StoreHydration />
        {children}
        <EmailVerificationPrompt />
      </body>
    </html>
  );
}
