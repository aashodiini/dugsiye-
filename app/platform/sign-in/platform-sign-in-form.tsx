"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { syncLocaleCookie } from "@/app/actions/locale";
import type { Messages } from "@/i18n/messages/en";
import { authClient } from "@/lib/auth-client";

// Platform Super Administrator sign-in (ADR 0007): email and password, then a
// code from the authenticator app. Administrators who haven't set up the app
// yet are sent to /platform/two-factor by the platform guard.
export function PlatformSignInForm({ messages }: { messages: Messages["platform"] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function done() {
    await syncLocaleCookie();
    router.replace("/platform");
    router.refresh();
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.signIn.email({ email: email.trim().toLowerCase(), password });
    setPending(false);
    if (result.error) {
      return setError(result.error.status === 401 ? messages.wrongCredentials : messages.failed);
    }
    if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
      return setNeedsCode(true);
    }
    await done();
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.twoFactor.verifyTotp({ code: code.trim() });
    if (result.error) {
      setPending(false);
      return setError(messages.wrongCode);
    }
    await done();
  }

  const input =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
  const button =
    "w-full rounded-md bg-zinc-900 px-3 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50";

  if (needsCode) {
    return (
      <form onSubmit={verifyCode} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">{messages.codePrompt}</p>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {messages.codeLabel}
          <input
            className={`${input} tracking-widest`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className={button} disabled={pending}>{messages.submit}</button>
      </form>
    );
  }

  return (
    <form onSubmit={signIn} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {messages.emailLabel}
        <input
          className={input}
          type="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {messages.passwordLabel}
        <input
          className={input}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className={button} disabled={pending}>{messages.continue}</button>
    </form>
  );
}
