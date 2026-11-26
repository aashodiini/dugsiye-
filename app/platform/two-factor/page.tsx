import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentIdentity } from "@/server/auth/session";
import { getMessages } from "@/server/i18n/locale";
import { platformAccess } from "@/server/platform/admins";
import { TwoFactorSetup } from "./two-factor-setup";

export default function TwoFactorPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <Suspense fallback={<div className="h-64" />}>
          <Setup />
        </Suspense>
      </div>
    </main>
  );
}

async function Setup() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/platform/sign-in");
  const access = await platformAccess(identity.id);
  if (access === "denied") notFound();
  if (access === "granted") redirect("/platform");

  const messages = getMessages(identity.preferredLocale);
  return (
    <>
      <h1 className="mb-2 text-xl font-semibold">{messages.platform.setupTitle}</h1>
      <TwoFactorSetup messages={messages.platform} />
    </>
  );
}
