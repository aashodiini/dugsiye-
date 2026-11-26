import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locales";
import { auth } from "./auth";
import { isPlaceholderEmail } from "./identity";

// The signed-in identity for this request: the one place server code reads the
// session (Data Access Layer). Returns a narrow object, never the raw session,
// and never the placeholder email of a phone-only identity.

export type Identity = {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  preferredLocale: Locale;
};

export const getCurrentIdentity = cache(async (): Promise<Identity | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    phoneNumber: user.phoneNumber ?? null,
    email: isPlaceholderEmail(user.email) ? null : user.email,
    preferredLocale: isLocale(user.preferredLocale) ? user.preferredLocale : DEFAULT_LOCALE,
  };
});

export async function requireIdentity(): Promise<Identity> {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/sign-in");
  return identity;
}
