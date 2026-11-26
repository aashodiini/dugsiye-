"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/actions/locale";
import { LOCALES, type Locale } from "@/i18n/locales";
import type { Messages } from "@/i18n/messages/en";

export function LanguageSwitcher({
  current,
  messages,
}: {
  current: Locale;
  messages: Messages["language"];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div role="group" aria-label={messages.label} className="flex gap-1 text-sm">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          disabled={pending || locale === current}
          aria-pressed={locale === current}
          onClick={() => startTransition(() => setLanguage(locale))}
          className="rounded-md px-2 py-1 aria-pressed:bg-zinc-900 aria-pressed:text-white hover:bg-zinc-200 disabled:cursor-default"
        >
          {messages[locale]}
        </button>
      ))}
    </div>
  );
}
