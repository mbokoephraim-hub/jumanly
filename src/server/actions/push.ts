"use server";

import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { removePushDevice, savePushDevice, vapidKeys } from "@/server/services/push";

/** The public key a device needs to say yes to the notifications of Jumanly. */
export async function pushKeyAction() {
  await requireUser("/app/notifications");
  return (await vapidKeys(db)).publicKey;
}

const device = z.object({
  endpoint: z.url().max(1000),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(100),
});

/** This device receives the notifications even outside the app (Ephraïm 29/10/2026). */
export async function savePushDeviceAction(input: z.input<typeof device>) {
  const parsed = device.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const user = await requireUser("/app/notifications");
  await savePushDevice(db, user.id, parsed.data);
  return { ok: true as const };
}

export async function removePushDeviceAction(endpoint: string) {
  const user = await requireUser("/app/notifications");
  await removePushDevice(db, user.id, String(endpoint).slice(0, 1000));
}
