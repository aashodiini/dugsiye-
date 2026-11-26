import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locales";
import { en, type Messages } from "@/i18n/messages/en";
import { so } from "@/i18n/messages/so";
import { getCurrentIdentity } from "@/server/auth/session";

// The locale for this request (ADR 0008): the signed-in user's saved
// preference, else the locale cookie, else the default. Reads the request, so
// callers must sit behind <Suspense>.

const MESSAGES: Record<Locale, Messages> = { so, en };

export async function getLocale(): Promise<Locale> {
  const identity = await getCurrentIdentity();
  if (identity) return identity.preferredLocale;
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
