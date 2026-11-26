import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentIdentity, type Identity } from "@/server/auth/session";
import { platformAccess } from "@/server/platform/admins";

// The gate for every platform page and action. Non-administrators get a 404
// rather than "forbidden", so the platform area isn't advertised.
export async function requirePlatformAdmin(): Promise<Identity> {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/platform/sign-in");
  const access = await platformAccess(identity.id);
  if (access === "denied") notFound();
  if (access === "needs-two-factor") redirect("/platform/two-factor");
  return identity;
}
