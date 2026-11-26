import { Suspense } from "react";
import { LanguageSwitcher } from "@/app/language-switcher";
import { SignOutButton } from "@/app/sign-out-button";
import { format } from "@/i18n/locales";
import { requireIdentity } from "@/server/auth/session";
import { getMessages } from "@/server/i18n/locale";
import { listActiveMemberships } from "@/server/platform/memberships";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6">
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const identity = await requireIdentity();
  const messages = getMessages(identity.preferredLocale);
  const memberships = await listActiveMemberships(identity.id);

  return (
    <>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{messages.app.name}</p>
          <p className="text-sm text-zinc-600">
            {format(messages.home.signedInAs, { name: identity.name })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={identity.preferredLocale} messages={messages.language} />
          <SignOutButton label={messages.home.signOut} />
        </div>
      </header>

      <h2 className="mb-3 font-medium">{messages.home.yourSchools}</h2>
      {memberships.length === 0 ? (
        <p className="text-sm text-zinc-600">{messages.home.noSchools}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl bg-white ring-1 ring-zinc-200">
          {memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <span>{m.school.name}</span>
              <span className="text-sm text-zinc-600">{messages.roles[m.role]}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
