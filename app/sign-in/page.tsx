import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/app/language-switcher";
import { getCurrentIdentity } from "@/server/auth/session";
import { getLocale, getMessages } from "@/server/i18n/locale";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <Suspense fallback={<div className="h-64" />}>
          <SignIn />
        </Suspense>
      </div>
    </main>
  );
}

async function SignIn() {
  if (await getCurrentIdentity()) redirect("/");
  const locale = await getLocale();
  const messages = getMessages(locale);
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{messages.signIn.title}</h1>
        <LanguageSwitcher current={locale} messages={messages.language} />
      </div>
      <SignInForm messages={messages.signIn} />
    </>
  );
}
