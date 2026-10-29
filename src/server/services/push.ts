/**
 * Notifications on the phone even outside the app (Ephraïm 29/10/2026: « que le message entre,
 * qu'on voie le message reçu »). Each device that said yes keeps a subscription; an important
 * notification (a new message, a connection request…) is also sent to the person's devices.
 * Like the e-mails, it says who wrote, never what.
 */
import { createTranslator } from "next-intl";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import messages from "../../../messages/fr.json";
import {
  makeVapidKeys,
  pushSender,
  type PushMessage,
  type VapidKeys,
} from "@/server/adapters/push";
import {
  importantNotificationTypes,
  notificationKey,
  notificationValues,
  type NotificationType,
} from "./notifications";

const KEY_NAME = "vapid";

/** The key pair of the platform: from the environment, or made once and kept in the base. */
export async function vapidKeys(db: PrismaClient): Promise<VapidKeys> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) return { publicKey, privateKey };
  const kept = await db.platformKey.findUnique({ where: { name: KEY_NAME } });
  if (kept) return kept.value as VapidKeys;
  const made = makeVapidKeys();
  // Two first sends at once: the first one written wins, both use it.
  await db.platformKey.createMany({
    data: [{ name: KEY_NAME, value: made as unknown as Prisma.InputJsonObject }],
    skipDuplicates: true,
  });
  const stored = await db.platformKey.findUniqueOrThrow({ where: { name: KEY_NAME } });
  return stored.value as VapidKeys;
}

export async function savePushDevice(
  db: PrismaClient,
  userId: string,
  device: { endpoint: string; p256dh: string; auth: string },
) {
  // A device follows the person signed in on it.
  await db.pushSubscription.upsert({
    where: { endpoint: device.endpoint },
    update: { userId, p256dh: device.p256dh, auth: device.auth },
    create: { userId, ...device },
  });
}

export async function removePushDevice(db: PrismaClient, userId: string, endpoint: string) {
  await db.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

type Translate = (key: string, values?: Record<string, string>) => string;

/** The words of the notification on the phone: « Nouveau message de Sublime » and a short line. */
export function pushMessageOf(
  type: NotificationType,
  payload: unknown,
  href: string,
  icon?: string | null,
): PushMessage {
  const t = createTranslator({ locale: "fr", messages }) as unknown as Translate;
  const values = notificationValues(payload);
  const message =
    type === "newMessage"
      ? {
          title: t("push.newMessage.title", values),
          body: values.jobTitle ? t("push.newMessage.job", values) : t("push.newMessage.body"),
          tag: href,
        }
      : {
          title: t("common.brand"),
          body: t(`notifications.item.${notificationKey(type, values)}`, values),
        };
  return { ...message, url: href, ...(icon ? { icon } : {}) };
}

/** Sends an important notification to the devices of these people; a device gone is forgotten. */
export async function pushNotification(
  db: PrismaClient,
  input: { userIds: string[]; type: NotificationType; payload: unknown; href: string },
) {
  if (!importantNotificationTypes.includes(input.type) || input.userIds.length === 0) return;
  const devices = await db.pushSubscription.findMany({ where: { userId: { in: input.userIds } } });
  if (devices.length === 0) return;
  const actorId = notificationValues(input.payload).actorId;
  const actor = actorId
    ? await db.user.findUnique({ where: { id: actorId }, select: { image: true } })
    : null;
  const sender = pushSender(await vapidKeys(db));
  const message = pushMessageOf(input.type, input.payload, input.href, actor?.image);
  const gone: string[] = [];
  await Promise.all(
    devices.map(async (device) => {
      const result = await sender.send(device, message).catch((error) => {
        console.error("[push]", error);
        return "sent" as const;
      });
      if (result === "gone") gone.push(device.id);
    }),
  );
  if (gone.length > 0) await db.pushSubscription.deleteMany({ where: { id: { in: gone } } });
}
