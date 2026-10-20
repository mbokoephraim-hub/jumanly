/**
 * « Mes offres » and the job form of the recruiter mobile redesign (brief recruteur § 2.4 to 2.7,
 * planches recruteur-1 r2 to r4): tabs, the colour of each offer, its real figures, the four steps
 * of the form (saved at each step), documents asked and screening questions, the optional job
 * sheet in PDF, the typed history and the performance of an offer.
 *
 * Every query goes through `jobScope` / `getOrgJob` (golden rule n° 6). Nothing here reads a plan
 * name; the active-job limit is `jobs.active.max`. A screening question is never a condition to
 * apply (golden rule n° 1): it is shown to the talent, answering is optional.
 */
import { randomUUID } from "node:crypto";
import { PDFDict, PDFDocument, PDFName, PDFStream } from "pdf-lib";
import { getDocumentProxy } from "unpdf";
import { z } from "zod";
import { Prisma, type JobStatus, type PrismaClient } from "@/generated/prisma/client";
import { studyFields } from "@/lib/studies";
import { fileStorage } from "@/server/storage";
import {
  activeStatuses,
  contractTypes,
  getOrgJob,
  HireError,
  hirePermissions,
  isProtectedCriterion,
  jobScope,
  KNOCKOUT_MAX,
  moderationFlags,
  REQUIRED_SKILLS_MAX,
  remoteModes,
  type HireContext,
} from "./hire";
import { slugify } from "./accounts";
import { findSkill } from "./profile";
import { screeningQuestionSchema } from "./screening";

const DAY = 86_400_000;

// ─── Tabs and colours of « Mes offres » ─────────────────────────────────────────────────────────

export const offerTabs = ["actives", "brouillons", "pause", "cloturees", "expirees"] as const;
export type OfferTab = (typeof offerTabs)[number];

/** Where a job sits in « Mes offres »; an archived job is not listed. */
export function offerTabOf(
  job: { status: JobStatus; closesAt: Date | null },
  now = new Date(),
): OfferTab | null {
  switch (job.status) {
    case "published":
      return job.closesAt && job.closesAt <= now ? "expirees" : "actives";
    case "pending_review":
      return "actives";
    case "draft":
    case "rejected":
    case "changes_requested":
      return "brouillons";
    case "paused":
      return "pause";
    case "closed":
      return "cloturees";
    default:
      return null;
  }
}

/**
 * The colour of an offer (brief recruteur § 2.7): each published offer takes the next colour of the
 * charter, lime, mint, amber, then again, in the order of publication, so that it keeps its colour;
 * soft blue while « En validation »; none for a draft or a closed offer.
 */
export type OfferColor = "c1" | "c2" | "c3" | "c4" | "c0";

export function offerColors(
  jobs: { id: string; status: JobStatus; publishedAt: Date | null; createdAt: Date }[],
): Map<string, OfferColor> {
  const colors = new Map<string, OfferColor>();
  const published = jobs
    .filter((job) => job.publishedAt)
    .sort(
      (a, b) =>
        a.publishedAt!.getTime() - b.publishedAt!.getTime() ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
  published.forEach((job, index) => colors.set(job.id, (["c1", "c2", "c3"] as const)[index % 3]!));
  for (const job of jobs) {
    if (job.status === "pending_review") colors.set(job.id, "c4");
    else if (!["published", "paused"].includes(job.status)) colors.set(job.id, "c0");
    else if (!colors.has(job.id)) colors.set(job.id, "c1");
  }
  return colors;
}

/**
 * The offers of the member, with the figures of their card: candidatures, new ones (not opened
 * yet), views and interviews. Real counts only.
 */
export async function listOffers(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const jobs = await db.job.findMany({
    where: { AND: [await jobScope(db, ctx), { status: { not: "archived" } }] },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      country: true,
      contractType: true,
      remote: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      closesAt: true,
      pausedAt: true,
      pausedByBillingAt: true,
      moderationReason: true,
      assignedToId: true,
      teamId: true,
      departmentId: true,
      entityId: true,
      assignedTo: { select: { name: true } },
      _count: { select: { applications: true } },
      applications: { where: { viewedAt: null, status: "active" }, select: { id: true } },
    },
  });
  const ids = jobs.map((job) => job.id);
  const [views, interviews] = await Promise.all([
    db.jobViewDay.groupBy({ by: ["jobId"], where: { jobId: { in: ids } }, _sum: { count: true } }),
    db.interview.findMany({
      where: {
        organizationId: ctx.organizationId,
        application: { jobId: { in: ids } },
        status: { notIn: ["canceled", "declined"] },
      },
      select: { application: { select: { jobId: true } } },
    }),
  ]);
  const colors = offerColors(jobs);
  return jobs.map(({ applications, _count, ...job }) => ({
    ...job,
    tab: offerTabOf(job, now),
    color: colors.get(job.id) ?? "c0",
    figures: {
      applications: _count.applications,
      unseen: applications.length,
      views: views.find((row) => row.jobId === job.id)?._sum.count ?? 0,
      interviews: interviews.filter((row) => row.application.jobId === job.id).length,
    },
  }));
}

export type OfferRow = Awaited<ReturnType<typeof listOffers>>[number];

/** Active offers and the limit, for « Offres actives : 3 sur 5 ». */
export function activeCount(jobs: { status: JobStatus }[]) {
  return jobs.filter((job) => (activeStatuses as readonly string[]).includes(job.status)).length;
}

// ─── The four steps of the job form ─────────────────────────────────────────────────────────────

export const jobSteps = ["poste", "description", "candidature", "verifier"] as const;
export type JobStep = (typeof jobSteps)[number];

export function jobStepOf(value: unknown): JobStep {
  const index = Number(value);
  if (Number.isInteger(index) && index >= 1 && index <= 4) return jobSteps[index - 1]!;
  return jobSteps.includes(value as JobStep) ? (value as JobStep) : "poste";
}

/** Experience asked (planche CR1 « 0 à 2 ans »): the minimum years of each band. */
export const experienceBands = [0, 2, 5, 10] as const;

export const requestedDocumentKinds = ["cv", "letter", "diploma", "portfolio"] as const;
export type RequestedDocument = (typeof requestedDocumentKinds)[number];

export const SCREENING_MAX = 5;
export {
  screeningAnswersFor,
  screeningAnswersOf,
  screeningQuestionSchema,
  screeningQuestionsOf,
  type ScreeningAnswer,
  type ScreeningQuestion,
} from "./screening";
export const OPENINGS_MAX = 50;

const lines = (max: number, length = 300) =>
  z
    .string()
    .default("")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean)
        .map((line) => line.slice(0, length)),
    )
    .pipe(z.array(z.string()).max(max, "tooMany"));

const money = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000)])
  .transform((value) => (value === "" ? null : value * 100));

export const stepSchemas = {
  poste: z
    .object({
      title: z.string().trim().min(3, "required").max(120),
      domain: z.union([z.literal(""), z.enum(studyFields)]).default(""),
      experienceMin: z.coerce.number().int().min(0).max(40).default(0),
      city: z.string().trim().min(1, "required").max(120),
      country: z.string().trim().min(1, "required").max(80),
      remote: z.enum(remoteModes),
      contractType: z.enum(contractTypes),
      openings: z.coerce.number().int().min(1).max(OPENINGS_MAX).default(1),
      salaryMin: money.default(null),
      salaryMax: money.default(null),
    })
    .superRefine((value, ctx) => {
      if (value.salaryMin !== null && value.salaryMax !== null && value.salaryMax < value.salaryMin)
        ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "salaryRange" });
    }),
  description: z.object({
    description: z.string().trim().max(8000).default(""),
    responsibilities: lines(20),
    requirements: lines(20),
    benefits: lines(15),
    requiredSkills: z.string().default(""),
    preferredSkills: z.string().default(""),
  }),
  candidature: z
    .object({
      closesAt: z
        .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
        .default("")
        .transform((value) => (value ? new Date(`${value}T23:59:59Z`) : null)),
      documents: z.array(z.enum(requestedDocumentKinds)).default([]),
      questions: z
        .string()
        .default("[]")
        .transform((value, ctx) => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            ctx.addIssue({ code: "custom", message: "invalid" });
            return z.NEVER;
          }
        })
        .pipe(z.array(screeningQuestionSchema).max(SCREENING_MAX, "tooMany")),
      instructions: z.string().trim().max(1000).default(""),
      knockout: lines(KNOCKOUT_MAX, 160),
    })
    .superRefine((value, ctx) => {
      if (value.knockout.some(isProtectedCriterion))
        ctx.addIssue({ code: "custom", path: ["knockout"], message: "forbidden" });
      if (value.questions.some((question) => isProtectedCriterion(question.text)))
        ctx.addIssue({ code: "custom", path: ["questions"], message: "forbidden" });
    }),
} as const;

export type StepResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string; field?: string; unknownSkills?: string[] };

const skillNames = (value: string) =>
  [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);

async function uniqueSlug(db: PrismaClient, title: string, city: string) {
  const base = slugify(`${title} ${city}`).slice(0, 70) || "offre";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${randomUUID().slice(0, 6)}`;
    if (!(await db.job.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${randomUUID().slice(0, 12)}`;
}

/** What a recruiter changed on a live offer, kept in the history (« a prolongé la date… »). */
type Change =
  | { field: "closesAt"; to: string | null }
  | { field: "skills"; added: string[] }
  | { field: "other" };

/**
 * Saves one step of the job form. Step 1 creates the draft (the form saves at each step,
 * planche CR « Brouillon enregistré »); the other steps need the draft. A live offer is changed in
 * place: risky wording sends it back to review, and each change goes into its history.
 */
export async function saveJobStep(
  db: PrismaClient,
  ctx: HireContext,
  step: Exclude<JobStep, "verifier">,
  raw: Record<string, unknown>,
  jobId?: string,
): Promise<StepResult> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const parsed = stepSchemas[step].safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "invalid", field: String(issue?.path[0] ?? "") };
  }
  const job = jobId ? await getOrgJob(db, ctx, jobId) : null;
  if (job && (job.status === "closed" || job.status === "archived")) throw new HireError("invalid");
  if (!job && step !== "poste") throw new HireError("notFound");

  let data: Prisma.JobUpdateInput = {};
  const changes: Change[] = [];
  let skills: { skillId: string; importance: "required" | "preferred"; name: string }[] | null =
    null;

  if (step === "poste") {
    const input = stepSchemas.poste.parse(raw);
    data = {
      title: input.title,
      domain: input.domain || null,
      experienceMin: input.experienceMin,
      city: input.city,
      country: input.country,
      remote: input.remote,
      contractType: input.contractType,
      openings: input.openings,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
    };
  } else if (step === "description") {
    const input = stepSchemas.description.parse(raw);
    const required = skillNames(input.requiredSkills);
    const preferred = skillNames(input.preferredSkills).filter((name) => !required.includes(name));
    if (required.length > REQUIRED_SKILLS_MAX)
      return { ok: false, error: "tooMany", field: "requiredSkills" };
    const unknown: string[] = [];
    skills = [];
    for (const [names, importance] of [
      [required, "required"],
      [preferred, "preferred"],
    ] as const) {
      for (const name of names) {
        const skill = await findSkill(db, name);
        if (!skill) unknown.push(name);
        else if (!skills.some((item) => item.skillId === skill.id))
          skills.push({ skillId: skill.id, importance, name: skill.name });
      }
    }
    if (unknown.length > 0)
      return { ok: false, error: "unknownSkills", field: "requiredSkills", unknownSkills: unknown };
    data = {
      description: input.description,
      responsibilities: input.responsibilities,
      requirements: input.requirements,
      benefits: input.benefits,
    };
    if (job) {
      const before = new Set(job.skills.map((item) => item.skillId));
      const added = skills.filter((item) => !before.has(item.skillId)).map((item) => item.name);
      if (added.length) changes.push({ field: "skills", added });
    }
  } else {
    const input = stepSchemas.candidature.parse(raw);
    data = {
      closesAt: input.closesAt,
      requestedDocuments: input.documents,
      screeningQuestions: input.questions,
      applicationInstructions: input.instructions || null,
      knockoutCriteria: input.knockout,
    };
    if (job && (job.closesAt?.getTime() ?? null) !== (input.closesAt?.getTime() ?? null))
      changes.push({ field: "closesAt", to: input.closesAt?.toISOString() ?? null });
  }

  if (!job) {
    const input = stepSchemas.poste.parse(raw);
    const created = await db.job.create({
      data: {
        ...(data as Prisma.JobCreateInput),
        title: input.title,
        city: input.city,
        country: input.country,
        remote: input.remote,
        contractType: input.contractType,
        description: "",
        organization: { connect: { id: ctx.organizationId } },
        createdBy: { connect: { id: ctx.userId } },
        slug: await uniqueSlug(db, input.title, input.city),
        status: "draft",
      },
    });
    return { ok: true, jobId: created.id };
  }

  const live = job.status === "published" || job.status === "paused";
  // A live offer edited with risky wording goes back to review, like at publication.
  const merged = {
    title: (data.title as string | undefined) ?? job.title,
    description: (data.description as string | undefined) ?? job.description,
    responsibilities: (data.responsibilities as string[] | undefined) ?? job.responsibilities,
    requirements: (data.requirements as string[] | undefined) ?? job.requirements,
    benefits: (data.benefits as string[] | undefined) ?? job.benefits,
  };
  const flags = job.status === "published" ? moderationFlags(merged) : [];
  await db.$transaction([
    ...(skills ? [db.jobSkill.deleteMany({ where: { jobId: job.id } })] : []),
    db.job.update({
      where: { id: job.id },
      data: {
        ...data,
        ...(skills
          ? {
              skills: {
                create: skills.map((item) => ({
                  skillId: item.skillId,
                  importance: item.importance,
                  weight: item.importance === "required" ? 4 : 2,
                  minLevel: 2,
                })),
              },
            }
          : {}),
        ...(flags.length > 0 ? { status: "pending_review", moderationFlags: flags } : {}),
      },
    }),
  ]);
  if (live) {
    const fields = changes.length ? changes : [{ field: "other" } as Change];
    await db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "job.update",
        targetType: "job",
        targetId: job.id,
        organizationId: ctx.organizationId,
        metadata: { changes: fields, step },
      },
    });
  }
  return { ok: true, jobId: job.id };
}

/** What is still missing before publication (planche CR4), in the order of the steps. */
export function missingForPublication(job: {
  description: string;
  skills: { importance: string }[];
}): ("description" | "skills")[] {
  const missing: ("description" | "skills")[] = [];
  if (!job.description.trim()) missing.push("description");
  if (!job.skills.some((skill) => skill.importance === "required")) missing.push("skills");
  return missing;
}

// ─── Job sheet in PDF ───────────────────────────────────────────────────────────────────────────

/**
 * A request to the site stops at 4.2 MB (`serverActions.bodySizeLimit`): the sheet stays under
 * 4 MB, not the 5 MB of the brief (same choice as the CV import, docs/decisions).
 */
export const JOB_SHEET_MAX_BYTES = 4 * 1024 * 1024;

export class JobSheetError extends Error {
  constructor(readonly code: "type" | "size" | "active" | "encrypted" | "unreadable") {
    super(code);
    this.name = "JobSheetError";
  }
}

/** Keys and actions that make a PDF run something when opened (scripts, launches, forms, media). */
const ACTIVE_KEYS = [
  "JS",
  "JavaScript",
  "Launch",
  "EmbeddedFile",
  "EmbeddedFiles",
  "RichMedia",
  "XFA",
];
const ACTIVE_ACTIONS = [
  "JavaScript",
  "Launch",
  "SubmitForm",
  "ImportData",
  "GoToE",
  "Rendition",
  "Movie",
  "Sound",
  "RichMediaExecute",
];
const RAW_ACTIVE = new RegExp(
  `/(?:${[...ACTIVE_KEYS, "AA", "OpenAction"].join("|")})\\b[^]{0,200}?/(?:S\\s*/)?(?:${ACTIVE_ACTIONS.join("|")})\\b|/(?:JS|JavaScript|Launch|EmbeddedFile|RichMedia|XFA)\\b`,
);

/** Whether one object of the PDF holds active content (the analysis « avant publication »). */
function activeObject(object: unknown) {
  const dict = object instanceof PDFStream ? object.dict : object;
  if (!(dict instanceof PDFDict)) return false;
  for (const key of ACTIVE_KEYS) if (dict.has(PDFName.of(key))) return true;
  const action = dict.get(PDFName.of("S"));
  if (action instanceof PDFName && ACTIVE_ACTIONS.includes(action.decodeText())) return true;
  return false;
}

/**
 * Checks a job sheet before it is kept (brief recruteur § 2.5, « analysé avant publication »): a
 * real PDF (by its first bytes), 4 MB at most, not encrypted, without active content (scripts,
 * launch actions, embedded files, forms that send data). Returns its pages and the text of each.
 * No paid antivirus is called (decision of 20/10, docs/decisions/2026-10-20-recruteur-lot-2.md).
 */
export async function checkJobSheet(bytes: Uint8Array) {
  if (bytes.byteLength > JOB_SHEET_MAX_BYTES) throw new JobSheetError("size");
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46))
    throw new JobSheetError("type");
  if (RAW_ACTIVE.test(Buffer.from(bytes).toString("latin1"))) throw new JobSheetError("active");
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    if (error instanceof Error && /encrypted/i.test(error.message))
      throw new JobSheetError("encrypted");
    throw new JobSheetError("unreadable");
  }
  for (const [, object] of doc.context.enumerateIndirectObjects())
    if (activeObject(object)) throw new JobSheetError("active");
  const pages = doc.getPageCount();
  if (pages < 1) throw new JobSheetError("unreadable");
  let text: string[] = [];
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    for (let number = 1; number <= Math.min(pdf.numPages, 20); number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const rows: string[] = [];
      let row = "";
      for (const item of content.items as { str?: string; hasEOL?: boolean }[]) {
        row += item.str ?? "";
        if (item.hasEOL) {
          rows.push(row.replace(/\s+/g, " ").trim());
          row = "";
        }
      }
      if (row.trim()) rows.push(row.replace(/\s+/g, " ").trim());
      text.push(rows.filter(Boolean).join("\n").slice(0, 6000));
    }
  } catch {
    text = [];
  }
  return { pages, text };
}

/** Keeps the checked sheet on the job (replacing the previous one). */
export async function attachJobSheet(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  file: { name: string; bytes: Uint8Array },
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const { pages, text } = await checkJobSheet(file.bytes);
  const storage = fileStorage(db);
  const key = `jobs/${job.id}/fiche-${randomUUID()}.pdf`;
  await storage.put(key, { contentType: "application/pdf", bytes: file.bytes });
  if (job.jobSheetKey) await storage.remove(job.jobSheetKey);
  const name = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, "").slice(0, 120) || "fiche.pdf";
  await db.job.update({
    where: { id: job.id },
    data: {
      jobSheetKey: key,
      jobSheetName: name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`,
      jobSheetSize: file.bytes.byteLength,
      jobSheetPages: pages,
      jobSheetText: text,
    },
  });
}

export async function removeJobSheet(db: PrismaClient, ctx: HireContext, jobId: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  if (job.jobSheetKey) await fileStorage(db).remove(job.jobSheetKey);
  await db.job.update({
    where: { id: job.id },
    data: {
      jobSheetKey: null,
      jobSheetName: null,
      jobSheetSize: null,
      jobSheetPages: null,
      jobSheetText: Prisma.DbNull,
    },
  });
}

/** The text of each page of a job sheet, read safely. */
export function jobSheetPagesOf(value: Prisma.JsonValue | null | undefined): string[] {
  const parsed = z.array(z.string()).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/**
 * Lines of the sheet that look like the items of a list (« • », « - », « * »), not already in the
 * offer: what Orbi can propose to add without a model (nothing is invented, the recruiter reads
 * before applying).
 */
export function sheetListItems(pages: string[], already: string[], max = 5) {
  const known = new Set(already.map((item) => item.toLocaleLowerCase("fr").trim()));
  const items: string[] = [];
  for (const line of pages.join("\n").split("\n")) {
    const match = /^\s*(?:[-•*·▪●]|\d+[.)])\s+(.{8,200})$/.exec(line);
    if (!match) continue;
    const item = match[1]!.trim().replace(/[;.]$/, "");
    const key = item.toLocaleLowerCase("fr");
    if (known.has(key) || isProtectedCriterion(item)) continue;
    known.add(key);
    items.push(item);
    if (items.length >= max) break;
  }
  return items;
}

// ─── History of an offer ────────────────────────────────────────────────────────────────────────

export type HistoryEvent = {
  at: Date;
  type: "message" | "candidature" | "modification" | "publication";
  /** Key of `hireOffers.history.*` and its values. */
  key: string;
  values: Record<string, string>;
  /** A message shows its text (brief recruteur § 2.7). */
  text?: string;
};

const firstNameAndInitial = (name: string | null | undefined) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0]! : `${parts[0]} ${parts[parts.length - 1]![0]}.`;
};

/**
 * The typed history of an offer (planche r4 « Historique »): publication, changes, applications
 * and the team's messages to its candidates, newest first.
 */
export async function offerHistory(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  take = 30,
): Promise<HistoryEvent[]> {
  const job = await getOrgJob(db, ctx, jobId);
  const [logs, applications, members] = await Promise.all([
    db.auditLog.findMany({
      where: { targetType: "job", targetId: job.id, organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.application.findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: "desc" },
      take,
      select: { createdAt: true, profile: { select: { user: { select: { name: true } } } } },
    }),
    db.membership.findMany({
      where: { organizationId: ctx.organizationId },
      select: { userId: true, user: { select: { name: true } } },
    }),
  ]);
  const team = new Map(members.map((member) => [member.userId, member.user.name]));
  const messages = await db.message.findMany({
    where: {
      conversation: { application: { jobId: job.id }, organizationId: ctx.organizationId },
      senderId: { in: [...team.keys()] },
      hiddenAt: null,
      kind: "text",
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      createdAt: true,
      senderId: true,
      body: true,
      conversation: {
        select: {
          application: { select: { profile: { select: { user: { select: { name: true } } } } } },
        },
      },
    },
  });
  const actorName = (id: string | null) => firstNameAndInitial(team.get(id ?? "") ?? "");
  const events: HistoryEvent[] = [];
  for (const log of logs) {
    const actor = actorName(log.actorId);
    const meta = (log.metadata ?? {}) as { status?: string; changes?: Change[] };
    switch (log.action) {
      case "job.publish":
      case "job.resubmit":
        events.push({
          at: log.createdAt,
          type: "publication",
          key: meta.status === "pending_review" ? "sentForReview" : "published",
          values: { actor },
        });
        break;
      case "job.approve":
        events.push({ at: log.createdAt, type: "publication", key: "approved", values: {} });
        break;
      case "job.resume":
        events.push({ at: log.createdAt, type: "publication", key: "resumed", values: { actor } });
        break;
      case "job.pause":
        events.push({ at: log.createdAt, type: "modification", key: "paused", values: { actor } });
        break;
      case "job.close":
        events.push({ at: log.createdAt, type: "modification", key: "closed", values: { actor } });
        break;
      case "job.update":
        for (const change of meta.changes ?? [{ field: "other" }]) {
          if (change.field === "closesAt")
            events.push({
              at: log.createdAt,
              type: "modification",
              key: change.to ? "deadline" : "deadlineRemoved",
              values: { actor, date: change.to ?? "" },
            });
          else if (change.field === "skills")
            events.push({
              at: log.createdAt,
              type: "modification",
              key: "skills",
              values: {
                actor,
                skills: change.added.join(", "),
                count: String(change.added.length),
              },
            });
          else
            events.push({
              at: log.createdAt,
              type: "modification",
              key: "edited",
              values: { actor },
            });
        }
        break;
    }
  }
  for (const application of applications)
    events.push({
      at: application.createdAt,
      type: "candidature",
      key: "applied",
      values: { name: firstNameAndInitial(application.profile.user.name) },
    });
  for (const message of messages)
    events.push({
      at: message.createdAt,
      type: "message",
      key: "message",
      values: {
        actor: actorName(message.senderId),
        name: firstNameAndInitial(message.conversation.application?.profile.user.name),
      },
      text: message.body.slice(0, 280),
    });
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}

// ─── Views and performance ──────────────────────────────────────────────────────────────────────

const utcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/** One view of a job's page (the public page or the signed-in one): a counter per day, no person. */
export async function recordJobView(db: PrismaClient, slug: string, now = new Date()) {
  const job = await db.job.findFirst({
    where: { slug, status: { in: ["published", "paused", "closed"] } },
    select: { id: true },
  });
  if (!job) return false;
  const day = utcDay(now);
  await db.jobViewDay.upsert({
    where: { jobId_day: { jobId: job.id, day } },
    create: { jobId: job.id, day, count: 1 },
    update: { count: { increment: 1 } },
  });
  return true;
}

/**
 * « Performance » of an offer (planche r4): views, the share of viewers who applied, the average
 * delay of the team's first answer, and the views of the last seven days. Real figures only.
 */
export async function offerPerformance(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  now = new Date(),
) {
  const job = await getOrgJob(db, ctx, jobId);
  const since = new Date(utcDay(now).getTime() - 6 * DAY);
  const [total, days, applications] = await Promise.all([
    db.jobViewDay.aggregate({ where: { jobId: job.id }, _sum: { count: true } }),
    db.jobViewDay.findMany({ where: { jobId: job.id, day: { gte: since } } }),
    db.application.findMany({
      where: { jobId: job.id },
      select: {
        createdAt: true,
        events: {
          where: { type: { in: ["stage_changed", "decision"] } },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);
  const views = total._sum.count ?? 0;
  const delays = applications
    .filter((row) => row.events[0])
    .map((row) => (row.events[0]!.createdAt.getTime() - row.createdAt.getTime()) / DAY);
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(since.getTime() + index * DAY);
    return {
      day,
      count: days.find((row) => row.day.getTime() === day.getTime())?.count ?? 0,
    };
  });
  return {
    views,
    applied: views > 0 ? applications.length / views : null,
    responseDays: delays.length
      ? Math.round((delays.reduce((sum, value) => sum + value, 0) / delays.length) * 10) / 10
      : null,
    week,
  };
}

/** The candidates of each stage of an offer (planche r4 « Étapes »), outcomes in the last one. */
export async function offerStages(db: PrismaClient, ctx: HireContext, jobId: string) {
  const job = await getOrgJob(db, ctx, jobId);
  const [stages, counts] = await Promise.all([
    db.pipelineStage.findMany({ where: { jobId: job.id }, orderBy: { order: "asc" } }),
    db.application.groupBy({
      by: ["stageId"],
      where: { jobId: job.id, status: { not: "withdrawn" } },
      _count: { _all: true },
    }),
  ]);
  const countOf = (stageId: string) =>
    counts.find((row) => row.stageId === stageId)?._count._all ?? 0;
  const followed = stages.filter((stage) => stage.kind !== "hired" && stage.kind !== "rejected");
  const outcomes = stages
    .filter((stage) => stage.kind === "hired" || stage.kind === "rejected")
    .reduce((sum, stage) => sum + countOf(stage.id), 0);
  return followed.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    count: countOf(stage.id) + (index === followed.length - 1 ? outcomes : 0),
  }));
}
