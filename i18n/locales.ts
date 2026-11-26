// Somali and English (ADR 0008). Safe to import from client and server code.

export const LOCALES = ["so", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "so";

// Mirrors the signed-in user's preferredLocale so that pages which don't know
// the user yet (sign-in) and the <html lang> script can read it. The saved
// preference on the identity is the source of truth.
export const LOCALE_COOKIE = "dugsiye_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Fills {placeholders} in a message.
export function format(message: string, values: Record<string, string>): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
