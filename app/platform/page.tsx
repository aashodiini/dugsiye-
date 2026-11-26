import { Suspense } from "react";
import { LanguageSwitcher } from "@/app/language-switcher";
import { SignOutButton } from "@/app/sign-out-button";
import { format } from "@/i18n/locales";
import { getMessages } from "@/server/i18n/locale";
import { platformDb } from "@/server/platform/db";
import { requirePlatformAdmin } from "@/server/platform/guard";

export default function PlatformHome() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-6">
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const identity = await requirePlatformAdmin();
  const messages = getMessages(identity.preferredLocale);
  const schools = await platformDb().school.count({ where: { status: { not: "ARCHIVED" } } });

  return (
    <>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{messages.platform.title}</p>
          <p className="text-sm text-zinc-600">
            {format(messages.home.signedInAs, { name: identity.name })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={identity.preferredLocale} messages={messages.language} />
          <SignOutButton label={messages.home.signOut} redirectTo="/platform/sign-in" />
        </div>
      </header>
      <p>{format(messages.platform.schoolsCount, { count: String(schools) })}</p>
      <p className="mt-2 text-sm text-zinc-600">{messages.platform.comingNext}</p>
    </>
  );
}
