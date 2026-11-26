import "server-only";
import type { Locale } from "@/i18n/locales";
import { platformDb } from "@/server/platform/db";

export async function savePreferredLocale(userId: string, locale: Locale): Promise<void> {
  await platformDb().user.update({ where: { id: userId }, data: { preferredLocale: locale } });
}
