import "server-only";
import { APIError } from "better-auth/api";
import { platformDb } from "@/server/platform/db";
import { isKnownContact, type Contact } from "@/server/platform/invitations";
import { emailSender, smsSender } from "./senders";

// Every sign-in code goes through here (ADR 0007):
// - codes go only to contacts the Platform knows, so strangers can't create
//   accounts or run up SMS costs. Unknown contacts get the same response as
//   known ones, so the endpoint can't be used to discover who is registered.
// - each destination gets at most MAX_PER_HOUR codes, on top of Better Auth's
//   per-IP limits.

const MAX_PER_HOUR = 5;

export async function sendSignInCode(contact: Contact, code: string): Promise<void> {
  if (!(await isKnownContact(contact))) return;

  const channel = "phoneNumber" in contact ? "SMS" : "EMAIL";
  const destination = "phoneNumber" in contact ? contact.phoneNumber : contact.email;
  const db = platformDb();
  const recent = await db.codeSendLog.count({
    where: { destination, sentAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= MAX_PER_HOUR) {
    throw new APIError("TOO_MANY_REQUESTS", { message: "Too many codes requested. Try again later." });
  }

  await db.codeSendLog.create({ data: { channel, destination } });
  await (channel === "SMS" ? smsSender() : emailSender()).send(destination, code);
}
