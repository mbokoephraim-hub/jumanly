/**
 * Message templates of an organization (docs/ux-mobile-talent, prompt 5, screens 54-55): convocation,
 * document request, follow-up, acceptance and refusal. Every read and write carries the
 * organization's id (golden rule 6); a template of another organization is never found.
 */
import { z } from "zod";
import type { MessageTemplateKind, PrismaClient } from "@/generated/prisma/client";
import type { MatchExplanation } from "@/server/matching/types";
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

/**
 * The tones Jumanly's own refusal and acceptance texts come in (V7, screens 55 and 80). « organisation »
 * is the organization's (or the job's) own text, offered first when it exists.
 */
export const templateTones = ["chaleureux", "formel", "court"] as const;
export type TemplateTone = (typeof templateTones)[number];

/** The tone « Plus … » proposes under a refusal preview: warmer first, then shorter, then formal. */
export function nextTone(tone: TemplateTone | "organisation"): TemplateTone {
  return tone === "chaleureux" ? "court" : tone === "court" ? "formel" : "chaleureux";
}

/**
 * The candidate's strongest skill for the job, from the explanation frozen at application (doc 08):
 * a skill of the job the talent covers fully, verified ones and required ones first. Null when none
 * is fully covered: the texts then simply leave the sentence out.
 */
export function strongestSkill(explanation: MatchExplanation | null): string | null {
  if (!explanation) return null;
  const evidence = explanation.criteria.flatMap((criterion) => criterion.evidence ?? []);
  const covered = evidence
    .filter((item) => item.coverage >= 1 && item.talent !== null)
    .sort(
      (a, b) =>
        Number(b.verified) - Number(a.verified) ||
        b.required - a.required ||
        (b.talent ?? 0) - (a.talent ?? 0),
    );
  return covered[0]?.skill ?? null;
}

/**
 * The text cut where the values filled in by Jumanly appear, so the page can highlight them
 * (« Les champs surlignés se remplissent seuls », screen 80). The longest values are matched first.
 */
export function highlightSegments(text: string, values: (string | null | undefined)[]) {
  const wanted = [...new Set(values.filter((value): value is string => !!value?.trim()))].sort(
    (a, b) => b.length - a.length,
  );
  if (wanted.length === 0) return [{ text, filled: false }];
  const pattern = new RegExp(
    wanted.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const segments: { text: string; filled: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), filled: false });
    segments.push({ text: match[0], filled: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), filled: false });
  return segments;
}

/** A text written from sentence pieces: no double spaces or blank sentences when a piece is empty. */
export function tidyText(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
