"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locales";
import { savePreferredLocale } from "@/server/auth/preferences";
import { getCurrentIdentity } from "@/server/auth/session";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function writeLocaleCookie(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: false, // read by the <html lang> script
    path: "/",
  });
}

// Switches the whole system's language for this user (ADR 0008): saved on the
// identity when signed in, and mirrored to the cookie either way.
export async function setLanguage(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const identity = await getCurrentIdentity();
  if (identity) await savePreferredLocale(identity.id, locale);
  await writeLocaleCookie(locale);
  refresh();
}

// After signing in, make the cookie follow the identity's saved preference.
export async function syncLocaleCookie(): Promise<void> {
  const identity = await getCurrentIdentity();
  if (identity) await writeLocaleCookie(identity.preferredLocale);
}
