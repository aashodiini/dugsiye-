import { Suspense } from "react";
import { LanguageSwitcher } from "@/app/language-switcher";
import { getLocale, getMessages } from "@/server/i18n/locale";
import { PlatformSignInForm } from "./platform-sign-in-form";

export default function PlatformSignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <Suspense fallback={<div className="h-64" />}>
          <PlatformSignIn />
        </Suspense>
      </div>
    </main>
  );
}

async function PlatformSignIn() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{messages.platform.signInTitle}</h1>
        <LanguageSwitcher current={locale} messages={messages.language} />
      </div>
      <PlatformSignInForm messages={messages.platform} />
    </>
  );
}
