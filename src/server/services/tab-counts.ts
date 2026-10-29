/**
 * The counts on the phone's menu (Ephraïm 29/10/2026: « s'il y a trois messages, que l'icône
 * message montre trois »). What is unread stays counted until it is read (Chat, Candidatures);
 * what is simply new counts from the person's last visit to the tab, which the phone remembers
 * (Fil: posts of others; Explorer: offers published; Carrière: news of their applications).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { unreadCount } from "./connect";
import { newPostsSince, phoneNotificationFilters } from "./feed";
import type { HireContext } from "./hire";
import { recruiterBarCounts } from "./hire-phone";
import { openJobWhere } from "./jobs";

export type TabsSeen = { fil?: Date; explorer?: Date; carriere?: Date };

export type TabCounts = {
  fil: number;
  explorer?: number;
  carriere?: number;
  candidatures?: number;
  messages: number;
};

export async function talentTabCounts(
  db: PrismaClient,
  userId: string,
  seen: TabsSeen,
  now = new Date(),
): Promise<TabCounts> {
  const [fil, explorer, carriere, messages] = await Promise.all([
    seen.fil ? newPostsSince(db, userId, seen.fil) : 0,
    seen.explorer
      ? db.job.count({ where: { ...openJobWhere(now), publishedAt: { gt: seen.explorer } } })
      : 0,
    seen.carriere
      ? db.notification.count({
          where: {
            userId,
            readAt: null,
            type: { in: [...phoneNotificationFilters.candidatures] },
            createdAt: { gt: seen.carriere },
          },
        })
      : 0,
    unreadCount(db, { userId }),
  ]);
  return { fil, explorer, carriere, messages };
}

export async function recruiterTabCounts(
  db: PrismaClient,
  ctx: HireContext,
  seen: TabsSeen,
): Promise<TabCounts> {
  const [fil, bar] = await Promise.all([
    seen.fil ? newPostsSince(db, ctx.userId, seen.fil) : 0,
    recruiterBarCounts(db, ctx),
  ]);
  return { fil, candidatures: bar.newApplications, messages: bar.unreadMessages };
}
