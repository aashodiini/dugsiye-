import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "@/i18n/locales";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dugsiye",
  description: "School management in Somali and English",
};

// <html lang> follows the user's language (ADR 0008). Reading the cookie on
// the server would make every page request-bound, so this script sets it from
// the locale cookie before first paint, and the shell stays static.
const setLang = `(function(){var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]+)/);var l=m&&m[1];if(${JSON.stringify(LOCALES)}.indexOf(l)>=0)document.documentElement.lang=l;})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: setLang }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
