import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { can } from "@/server/entitlements";
import { stageCatalog, templateStageKeys, type StageKey } from "./applications";
import { SCORECARD_CRITERIA_MAX, storedCriteria } from "./evaluation";
import { hirePermissions, HireError, type HireContext } from "./hire";
import {
  organizationTemplate,
  saveTemplate,
  TEMPLATE_BODY_MAX,
  type TemplateKind,
} from "./message-templates";

/**
 * Réglages du recrutement (étape 3, A5, captures 085 à 087): the stages new offers start with, the
 * organization's message templates and its interview grid. The owner and the administrators only;
 * every read and write goes through their organization (golden rule n° 6) and is kept in the audit
 * log. The decision on a candidate always stays with a person (golden rule n° 3).
 */

function administer(ctx: HireContext) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
}

/** The templates of the screen, in the order of a recruitment. */
export const settingsTemplateKinds = [
  "convocation",
  "document",
  "relance",
  "refus",
  "acceptation",
] as const satisfies readonly TemplateKind[];

const CRITERION_MAX = 80;

async function audit(db: PrismaClient, ctx: HireContext, action: string, metadata: object) {
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action,
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

export async function recruitingSettings(db: PrismaClient, ctx: HireContext) {
  administer(ctx);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [org, templates, scorecards] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { pipelineTemplate: true, scorecardCriteria: true },
    }),
    Promise.all(settingsTemplateKinds.map((kind) => organizationTemplate(db, ctx, kind))),
    can(db, subject, "hire.scorecards"),
  ]);
  const keys = new Set(templateStageKeys(org.pipelineTemplate));
  return {
    stages: stageCatalog.map((stage) => ({
      key: stage.key,
      name: stage.name,
      fixed: stage.fixed,
      on: keys.has(stage.key),
    })),
    templates: settingsTemplateKinds.map((kind, index) => ({
      kind,
      body: templates[index]?.body ?? null,
    })),
    criteria: storedCriteria(org.scorecardCriteria).map((item) => item.name),
    scorecards,
  };
}

/** « Retirer » or « Ajouter » a stage of the new offers; the fixed ones never move. */
export async function setStage(db: PrismaClient, ctx: HireContext, key: string, on: boolean) {
  administer(ctx);
  const stage = stageCatalog.find((item) => item.key === key);
  if (!stage || stage.fixed) throw new HireError("invalid");
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { pipelineTemplate: true },
  });
  const keys = new Set<StageKey>(templateStageKeys(org.pipelineTemplate));
  if (on) keys.add(stage.key);
  else keys.delete(stage.key);
  const template = stageCatalog.filter((item) => keys.has(item.key)).map((item) => item.key);
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: { pipelineTemplate: template },
  });
  await audit(db, ctx, "org.settings.stages", { stage: stage.key, on });
  return stage.name;
}

/** « Enregistrer » a template: the organization's own text of that kind. */
export async function saveSettingsTemplate(
  db: PrismaClient,
  ctx: HireContext,
  kind: string,
  title: string,
  body: string,
) {
  administer(ctx);
  const known = settingsTemplateKinds.find((item) => item === kind);
  const clean = body.trim();
  if (!known || clean.length < 2 || clean.length > TEMPLATE_BODY_MAX) {
    throw new HireError("invalid");
  }
  const current = await organizationTemplate(db, ctx, known);
  await saveTemplate(db, ctx, { id: current?.id, kind: known, title, body: clean });
  await audit(db, ctx, "org.settings.template", { kind: known });
}

/** « Ajouter » or « Retirer » a criterion of the interview grid (at most ten). */
export async function setCriterion(
  db: PrismaClient,
  ctx: HireContext,
  input: { add: string } | { remove: string },
) {
  administer(ctx);
  if (!(await can(db, { type: "organization", id: ctx.organizationId }, "hire.scorecards"))) {
    throw new HireError("forbidden");
  }
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { scorecardCriteria: true },
  });
  const criteria = storedCriteria(org.scorecardCriteria);
  if ("add" in input) {
    const name = input.add.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > CRITERION_MAX) throw new HireError("invalid");
    if (criteria.length >= SCORECARD_CRITERIA_MAX) throw new HireError("invalid");
    if (criteria.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      throw new HireError("invalid");
    }
    criteria.push({ name, description: "" });
  } else {
    const index = criteria.findIndex((item) => item.name === input.remove);
    if (index < 0) throw new HireError("notFound");
    criteria.splice(index, 1);
  }
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: { scorecardCriteria: criteria.length > 0 ? criteria : Prisma.DbNull },
  });
  await audit(db, ctx, "org.settings.criteria", "add" in input ? { add: true } : { remove: true });
  return criteria.map((item) => item.name);
}
