/**
 * Downloads of the recruiter's web app v3 (docs/mvp-web-recruteur/prototype-v3, `XP`, `xpDoc`):
 * the six documents (talents, candidates, comparison, test results, team, consultation log) as
 * one shape the A4 template, the CSV and the Excel file all read. Real data only, scoped to the
 * organization; « Masquer les noms » turns every name into initials. Each download is written to
 * the audit log by the caller (`logDownload`).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { hirePermissions, HireError, type HireContext } from "./hire";
import { candidatesV3 } from "./hire-v3-candidates";
import { vivierV3 } from "./hire-v3-vivier";

export const EXPORT_DOCS = [
  "talents",
  "candidats",
  "comparaison",
  "tests",
  "equipe",
  "journal",
] as const;
export type ExportDoc = (typeof EXPORT_DOCS)[number];
export const EXPORT_FORMATS = ["pdf", "xlsx", "csv"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

const DAY = 86_400_000;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w[0]!.toUpperCase()}.`)
    .join(" ");

export type ExportCell = string | number | null;
export type ExportData = {
  doc: ExportDoc;
  org: string;
  /** Values the template words itself (counts, the offer's title). */
  facts: Record<string, string | number>;
  kpis: { key: string; value: string | number; note?: string | number }[];
  /** Keys of the columns (texts in `hireV3Export.cols`). */
  columns: string[];
  rows: ExportCell[][];
  /** Rows are the criteria and columns the people (the comparison). */
  transposed?: boolean;
};

export async function exportData(
  db: PrismaClient,
  ctx: HireContext,
  doc: ExportDoc,
  options: { jobId?: string | null; masked?: boolean; now?: Date } = {},
): Promise<ExportData> {
  const perms = hirePermissions(ctx.role);
  if (!perms.readApplications) throw new HireError("forbidden");
  const now = options.now ?? new Date();
  const name = (value: string | null | undefined) =>
    value ? (options.masked ? initials(value) : value) : "–";
  const org = (
    await db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    })
  ).name;
  const base = { doc, org };

  if (doc === "talents") {
    const data = await vivierV3(db, ctx);
    const talents = data?.talents ?? [];
    return {
      ...base,
      facts: { count: talents.length },
      kpis: [
        { key: "talents", value: talents.length },
        { key: "available", value: data?.available ?? 0 },
        { key: "close", value: data?.close.length ?? 0, note: data?.offer?.title ?? "" },
        { key: "pools", value: data?.pools.length ?? 0 },
      ],
      columns: ["talent", "headline", "pool", "skills", "proximity", "availability"],
      rows: talents.map((t) => [
        t.name ? name(t.name) : "–",
        t.headline,
        t.pool,
        t.skills.map((s) => s.name).join(", "),
        t.score === null ? null : `${t.score} %`,
        t.available ? "open" : "listening",
      ]),
    };
  }

  if (doc === "candidats" || doc === "comparaison") {
    const data = await candidatesV3(db, ctx, options.jobId ?? null);
    const stageName = (id: string) => data.stages.find((s) => s.id === id)?.name ?? "–";
    const sorted = [...data.candidates].sort((a, b) => b.score - a.score);
    const facts = { offer: data.job?.title ?? "", count: data.candidates.length };
    if (doc === "candidats")
      return {
        ...base,
        facts,
        kpis: [
          { key: "received", value: data.candidates.length },
          { key: "high", value: data.high },
          {
            key: "interview",
            value: data.candidates.filter(
              (c) => data.stages.find((s) => s.id === c.stageId)?.kind === "interview",
            ).length,
          },
          { key: "scored", value: data.candidates.filter((c) => c.scored).length },
        ],
        columns: ["rank", "candidate", "score", "stage", "source", "city"],
        rows: sorted.map((c, i) => [
          i + 1,
          name(c.name),
          c.scored ? `${c.score} %` : null,
          stageName(c.stageId),
          `source:${c.source}`,
          c.city,
        ]),
      };
    const top = sorted.slice(0, 3);
    const keys = [...new Set(top.flatMap((c) => c.criteria.map((k) => k.key)))];
    return {
      ...base,
      facts: { ...facts, count: top.length },
      kpis: [],
      transposed: true,
      columns: ["criterion", ...top.map((c) => name(c.name))],
      rows: [
        ["score", ...top.map((c) => (c.scored ? `${c.score} %` : null))],
        ["stage", ...top.map((c) => stageName(c.stageId))],
        ["headline", ...top.map((c) => c.role)],
        ["skill", ...top.map((c) => c.skill)],
        ["city", ...top.map((c) => c.city)],
        ...keys.map((key) => [
          `criterion:${key}`,
          ...top.map((c) => {
            const v = c.criteria.find((k) => k.key === key)?.value;
            return v === undefined ? null : `${v} %`;
          }),
        ]),
      ],
    };
  }

  if (doc === "tests")
    return {
      ...base,
      facts: { count: 0 },
      kpis: [],
      columns: ["rank", "candidate", "score", "duration"],
      rows: [],
    };

  if (doc === "journal") {
    if (!perms.manage) throw new HireError("forbidden");
    const since = new Date(now.getTime() - 30 * DAY);
    const logs = await db.auditLog.findMany({
      where: {
        organizationId: ctx.organizationId,
        action: "profile.view",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { actorId: true, targetId: true, createdAt: true },
    });
    const [actors, profiles] = await Promise.all([
      db.user.findMany({
        where: {
          id: { in: [...new Set(logs.map((l) => l.actorId).filter((v): v is string => !!v))] },
        },
        select: { id: true, name: true },
      }),
      db.talentProfile.findMany({
        where: {
          id: { in: [...new Set(logs.map((l) => l.targetId).filter((v): v is string => !!v))] },
        },
        select: { id: true, user: { select: { name: true } } },
      }),
    ]);
    const actor = (id: string | null) => actors.find((a) => a.id === id)?.name ?? null;
    const profile = (id: string | null) => profiles.find((p) => p.id === id)?.user.name ?? null;
    return {
      ...base,
      facts: { count: logs.length },
      kpis: [
        { key: "views", value: logs.length },
        { key: "members", value: new Set(logs.map((l) => l.actorId)).size },
        { key: "profiles", value: new Set(logs.map((l) => l.targetId)).size },
      ],
      columns: ["member", "profile", "date"],
      rows: logs.map((l) => [
        actor(l.actorId) ?? "–",
        name(profile(l.targetId)),
        l.createdAt.toISOString(),
      ]),
    };
  }

  // equipe: what each member did on the applications over the last seven days.
  const since = new Date(now.getTime() - 7 * DAY);
  const [members, events, interviews] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: { role: true, user: { select: { id: true, name: true } } },
    }),
    db.applicationEvent.groupBy({
      by: ["actorId"],
      where: {
        createdAt: { gte: since },
        application: { job: { organizationId: ctx.organizationId } },
      },
      _count: { _all: true },
    }),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        startsAt: { gte: since, lt: now },
        status: { in: ["confirmed", "done"] },
      },
      select: { participantIds: true },
    }),
  ]);
  const rows = members.map((m) => {
    const actions = events.find((e) => e.actorId === m.user.id)?._count._all ?? 0;
    const met = interviews.filter((i) => i.participantIds.includes(m.user.id)).length;
    return [m.user.name ?? "–", `role:${m.role}`, actions, met] as ExportCell[];
  });
  return {
    ...base,
    facts: { count: members.length },
    kpis: [
      { key: "members", value: members.length },
      { key: "actions", value: events.reduce((s, e) => s + e._count._all, 0) },
      { key: "interviews", value: interviews.length },
    ],
    columns: ["member", "role", "actions", "interviews"],
    rows,
  };
}

/** Every download is noted in the log (brief § Télécharger). */
export async function logDownload(
  db: PrismaClient,
  ctx: HireContext,
  doc: ExportDoc,
  format: ExportFormat,
  masked: boolean,
) {
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "report.export",
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
      metadata: { doc, format, masked },
    },
  });
}
