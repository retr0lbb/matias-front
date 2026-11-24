"use client";

import { useAuthStore } from "@/stores/auth-store";

function greetingFor(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** "Boa tarde, Henrique." with the signed-in user's first name. */
export function Greeting() {
  console.log(useAuthStore);
  const firstName = useAuthStore(
    (s) => s.user?.name?.trim().split(/\s+/)[0] || undefined,
  );
  const greeting = greetingFor(new Date().getHours());

  return (
    <h2 className="font-serif text-[44px] leading-[1.1] tracking-[-0.02em]">
      {firstName ? `${greeting}, ${firstName}.` : `${greeting}.`}
    </h2>
  );
}
