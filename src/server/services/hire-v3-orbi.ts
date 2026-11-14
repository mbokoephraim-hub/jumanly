/**
 * Orbi's panel of the recruiter's web app v3 (`orbi()` of docs/mvp-web-recruteur/prototype-v3):
 * « À faire aujourd'hui » (what waits for the member, from `hireToday`) and « Ce que j'ai fait pour
 * vous » (what the platform did on its own this week: the scores with their « Pourquoi ? », the
 * automatic acknowledgements). Real figures only (golden rule n° 11), filtered by `jobScope`
 * (golden rule n° 6). Orbi proposes, the member decides: nothing here moves a candidate.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, jobScope, type HireContext } from "./hire";
import { hireToday } from "./hire-today";

const DAY = 86_400_000;

export type HireOrbiTodo = {
  kind: "unseen" | "unread" | "invitations" | "scorecards";
  count: number;
  href: string;
};

export type HireOrbiDone = { kind: "scored" | "acknowledged"; count: number };

export async function hireOrbiPanel(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const scope = await jobScope(db, ctx);
  const reads = hirePermissions(ctx.role).readApplications;
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const [today, scored, acknowledged] = await Promise.all([
    hireToday(db, ctx, now),
    reads
      ? db.application.count({
          where: { job: scope, createdAt: { gte: weekAgo }, matchScore: { not: null } },
        })
      : 0,
    reads
      ? db.applicationEvent.count({
          where: { type: "acknowledged", createdAt: { gte: weekAgo }, application: { job: scope } },
        })
      : 0,
  ]);
  const todo: HireOrbiTodo[] = (
    [
      { kind: "unseen", count: today.counts.unseen, href: "/app/hire/candidats" },
      { kind: "unread", count: today.counts.unread, href: "/app/messages" },
      { kind: "invitations", count: today.counts.invitations, href: "/app/hire/entretiens" },
      { kind: "scorecards", count: today.counts.scorecards, href: "/app/hire/candidats" },
    ] satisfies HireOrbiTodo[]
  ).filter((item) => item.count > 0);
  const done: HireOrbiDone[] = (
    [
      { kind: "scored", count: scored },
      { kind: "acknowledged", count: acknowledged },
    ] satisfies HireOrbiDone[]
  ).filter((item) => item.count > 0);
  return { todo, done };
}

export type HireOrbiPanel = Awaited<ReturnType<typeof hireOrbiPanel>>;
