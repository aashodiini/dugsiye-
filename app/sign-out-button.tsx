"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ label, redirectTo = "/sign-in" }: { label: string; redirectTo?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.replace(redirectTo);
        router.refresh();
      }}
      className="rounded-md px-3 py-1 text-sm ring-1 ring-zinc-300 hover:bg-zinc-100"
    >
      {label}
    </button>
  );
}
