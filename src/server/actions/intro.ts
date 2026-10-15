"use server";

import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";

/**
 * The full welcome intro was played to its end or skipped (docs/refonte-connexion § 7): from now
 * on, sign-ins get the short version, on every device. The first date is kept.
 */
export async function markIntroSeen() {
  const session = await getSession();
  if (!session) return;
  await db.user.updateMany({
    where: { id: session.user.id, introSeenAt: null },
    data: { introSeenAt: new Date() },
  });
}
