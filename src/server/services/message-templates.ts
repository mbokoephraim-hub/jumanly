/**
 * Message templates of an organization (docs/ux-mobile-talent, prompt 5, screens 54-55): convocation,
 * document request, follow-up, acceptance and refusal. Every read and write carries the
 * organization's id (golden rule 6); a template of another organization is never found.
 */
import { z } from "zod";
import type { MessageTemplateKind, PrismaClient } from "@/generated/prisma/client";
import { HireError, hirePermissions, type HireContext } from "./hire";

export const templateKinds = [
  "convocation",
  "document",
  "relance",
  "acceptation",
  "refus",
] as const satisfies readonly MessageTemplateKind[];

export type TemplateKind = (typeof templateKinds)[number];

export const TEMPLATE_BODY_MAX = 4000;

export const templateSchema = z.object({
  kind: z.enum(templateKinds),
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(TEMPLATE_BODY_MAX),
});

export function listTemplates(db: PrismaClient, ctx: HireContext) {
  return db.messageTemplate.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ kind: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getTemplate(db: PrismaClient, ctx: HireContext, id: string) {
  const template = await db.messageTemplate.findFirst({
    where: { id, organizationId: ctx.organizationId },
  });
  if (!template) throw new HireError("notFound");
  return template;
}

/** The organization's own template of this kind (the latest edited), or null. */
export function organizationTemplate(db: PrismaClient, ctx: HireContext, kind: TemplateKind) {
  return db.messageTemplate.findFirst({
    where: { organizationId: ctx.organizationId, kind },
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveTemplate(
  db: PrismaClient,
  ctx: HireContext,
  input: z.infer<typeof templateSchema> & { id?: string },
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const data = {
    kind: input.kind,
    title: input.title,
    body: input.body,
    updatedById: ctx.userId,
  };
  if (input.id) {
    const template = await getTemplate(db, ctx, input.id);
    return db.messageTemplate.update({ where: { id: template.id }, data });
  }
  return db.messageTemplate.create({ data: { ...data, organizationId: ctx.organizationId } });
}

export async function deleteTemplate(db: PrismaClient, ctx: HireContext, id: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const template = await getTemplate(db, ctx, id);
  await db.messageTemplate.delete({ where: { id: template.id } });
}

export type TemplateValues = {
  firstName: string;
  jobTitle: string;
  company: string;
  signer: string;
};

/**
 * Fills the placeholders a recruiter can write: {prenom}, {poste}, {entreprise}, {signataire}.
 * Anything else between braces stays as written.
 */
export function fillTemplate(body: string, values: TemplateValues) {
  const map: Record<string, string> = {
    prenom: values.firstName,
    poste: values.jobTitle,
    entreprise: values.company,
    signataire: values.signer,
  };
  return body.replace(/\{(prenom|poste|entreprise|signataire)\}/g, (_, key: string) => map[key]!);
}

/** A decision message split into its paragraphs, as the DecisionCard shows them. */
export function decisionParagraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
