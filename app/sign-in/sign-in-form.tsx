"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { syncLocaleCookie } from "@/app/actions/locale";
import { format } from "@/i18n/locales";
import type { Messages } from "@/i18n/messages/en";
import { authClient } from "@/lib/auth-client";
import { normalizeEmail, normalizePhone } from "@/server/auth/identity";

type Channel = "phone" | "email";
type Result = { error: { status: number } | null };

// Sign-in with a one-time code (ADR 0007): enter a phone number or email,
// then the code sent to it. The server only sends codes to invited contacts,
// and answers the same either way, so this form never says who is registered.
export function SignInForm({ messages }: { messages: Messages["signIn"] }) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("phone");
  const [contact, setContact] = useState("");
  const [destination, setDestination] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function errorFor(result: Result, fallback: string) {
    return result.error?.status === 429 ? messages.tooMany : fallback;
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const target = channel === "phone" ? normalizePhone(contact) : normalizeEmail(contact);
    if (!target || (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target))) {
      setError(channel === "phone" ? messages.invalidPhone : messages.invalidEmail);
      return;
    }
    setPending(true);
    const result: Result =
      channel === "phone"
        ? await authClient.phoneNumber.sendOtp({ phoneNumber: target })
        : await authClient.emailOtp.sendVerificationOtp({ email: target, type: "sign-in" });
    setPending(false);
    if (result.error) return setError(errorFor(result, messages.failed));
    setDestination(target);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!destination) return;
    setError(null);
    setPending(true);
    const result: Result =
      channel === "phone"
        ? await authClient.phoneNumber.verify({ phoneNumber: destination, code: code.trim() })
        : await authClient.signIn.emailOtp({ email: destination, otp: code.trim() });
    if (result.error) {
      setPending(false);
      return setError(errorFor(result, messages.wrongCode));
    }
    await syncLocaleCookie();
    router.replace("/");
    router.refresh();
  }

  function startOver() {
    setDestination(null);
    setCode("");
    setError(null);
  }

  const input =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
  const button =
    "w-full rounded-md bg-zinc-900 px-3 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50";

  if (destination) {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">{format(messages.codeSent, { destination })}</p>
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
        <button type="button" onClick={startOver} className="text-sm text-zinc-600 underline">
          {messages.startOver}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-4">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-md bg-zinc-100 p-1 text-sm">
        {(["phone", "email"] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={channel === c}
            onClick={() => {
              setChannel(c);
              setContact("");
              setError(null);
            }}
            className="rounded px-2 py-1 aria-selected:bg-white aria-selected:shadow-sm"
          >
            {c === "phone" ? messages.usePhone : messages.useEmail}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {channel === "phone" ? messages.phoneLabel : messages.emailLabel}
        <input
          className={input}
          type={channel === "phone" ? "tel" : "email"}
          autoComplete={channel === "phone" ? "tel" : "email"}
          required
          autoFocus
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        {channel === "phone" && <span className="font-normal text-zinc-500">{messages.phoneHint}</span>}
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className={button} disabled={pending}>{messages.sendCode}</button>
      <p className="text-xs text-zinc-500">{messages.invitedOnly}</p>
    </form>
  );
}
