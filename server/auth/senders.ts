import "server-only";

// Delivery of sign-in codes. The SMS provider is not chosen yet (ADR 0010), so
// development prints codes to the terminal and tests collect them in memory.
// A real provider implements CodeSender and is selected by CODE_SENDER.

export interface CodeSender {
  send(destination: string, code: string): Promise<void>;
}

export type SentCode = { channel: "SMS" | "EMAIL"; destination: string; code: string };

// Codes sent through the memory sender, newest last. Tests read this.
export const sentCodes: SentCode[] = [];

function consoleSender(channel: SentCode["channel"]): CodeSender {
  return {
    async send(destination, code) {
      console.info(`[dev ${channel}] sign-in code for ${destination}: ${code}`);
    },
  };
}

function memorySender(channel: SentCode["channel"]): CodeSender {
  return {
    async send(destination, code) {
      sentCodes.push({ channel, destination, code });
    },
  };
}

function select(channel: SentCode["channel"]): CodeSender {
  const kind = process.env.CODE_SENDER ?? "console";
  if (kind === "memory") return memorySender(channel);
  if (kind === "console") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CODE_SENDER=console would print sign-in codes in production");
    }
    return consoleSender(channel);
  }
  throw new Error(`Unknown CODE_SENDER "${kind}"`);
}

export const smsSender = (): CodeSender => select("SMS");
export const emailSender = (): CodeSender => select("EMAIL");
