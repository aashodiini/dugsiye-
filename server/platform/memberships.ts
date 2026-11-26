import "server-only";
import { platformDb } from "@/server/platform/db";

// The Schools a person can currently work in: ACTIVE memberships at ACTIVE
// Schools. Spans Schools, so it runs on the platform client.
export async function listActiveMemberships(userId: string) {
  return platformDb().schoolMembership.findMany({
    where: { userId, status: "ACTIVE", school: { status: "ACTIVE" } },
    select: {
      id: true,
      role: true,
      school: { select: { id: true, name: true } },
    },
    orderBy: { school: { name: "asc" } },
  });
}
