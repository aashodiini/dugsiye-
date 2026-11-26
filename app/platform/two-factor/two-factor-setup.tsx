"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Messages } from "@/i18n/messages/en";
import { authClient } from "@/lib/auth-client";

type Setup = { totpURI: string; secret: string; backupCodes: string[] };

// Authenticator-app setup for a Platform Super Administrator. Two-factor is
// switched on only once a code from the app has been verified.
export function TwoFactorSetup({ messages }: { messages: Messages["platform"] }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.twoFactor.enable({ password });
    setPending(false);
    if (result.error || !result.data || !("totpURI" in result.data)) {
      return setError(result.error?.status === 401 ? messages.wrongCredentials : messages.failed);
    }
    const secret = new URL(result.data.totpURI).searchParams.get("secret") ?? "";
    setSetup({ totpURI: result.data.totpURI, secret, backupCodes: result.data.backupCodes });
  }

  async function finish(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.twoFactor.verifyTotp({ code: code.trim() });
    if (result.error) {
      setPending(false);
      return setError(messages.wrongCode);
    }
    router.replace("/platform");
    router.refresh();
  }

  const input =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
  const button =
    "w-full rounded-md bg-zinc-900 px-3 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50";

  if (!setup) {
    return (
      <form onSubmit={start} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">{messages.setupIntro}</p>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {messages.confirmPassword}
          <input
            className={input}
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className={button} disabled={pending}>{messages.continue}</button>
      </form>
    );
  }

  return (
    <form onSubmit={finish} className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{messages.setupKeyLabel}</h2>
        <p className="text-sm text-zinc-600">{messages.setupKeyHelp}</p>
        <code className="select-all break-all rounded-md bg-zinc-100 px-3 py-2 font-mono text-sm tracking-wider">
          {setup.secret.match(/.{1,4}/g)?.join(" ")}
        </code>
        <a href={setup.totpURI} className="text-sm text-zinc-700 underline">
          {messages.openInApp}
        </a>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{messages.backupCodesLabel}</h2>
        <p className="text-sm text-zinc-600">{messages.backupCodesHelp}</p>
        <ul className="grid grid-cols-2 gap-1 rounded-md bg-zinc-100 px-3 py-2 font-mono text-sm">
          {setup.backupCodes.map((c) => (
            <li key={c} className="select-all">{c}</li>
          ))}
        </ul>
      </section>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {messages.confirmCode}
        <input
          className={`${input} tracking-widest`}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className={button} disabled={pending}>{messages.finish}</button>
    </form>
  );
}
