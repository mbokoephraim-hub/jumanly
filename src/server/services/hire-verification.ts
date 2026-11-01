/**
 * « Dossier de vérification » (« JUMANLY Hire, logique du recrutement », la vérification des
 * retenus, Ephraïm 01/11/2026): a member asks one or more retained candidates for pieces (diploma,
 * transcript, referents, thesis, certificate, portfolio, practical test), each required or not, with
 * a deadline. The candidate is told in Messages, by a notification and by e-mail, drops their files
 * or reuses in one gesture an attestation of their Skills Passport. Orbi compares what can be
 * compared (school and year against the CV sent) and only points at what is « à vérifier ». Two
 * reminders before the deadline. Files are seen only by the team of the offer, each opening logged.
 *
 * Golden rule n° 1: nothing here touches the application itself; nobody is rejected for a missing
 * piece. Golden rule n° 6: every read goes through `getOrgJob` / `getOrgApplication`.
 */
import { z } from "zod";
import type { Prisma, PrismaClient, VerificationPiece } from "@/generated/prisma/client";
import { sniffDocumentType, type FileStorage } from "@/server/storage";
import { ensureApplicationConversation } from "./connect";
import { getOrgApplication, getOrgJob, HireError, hirePermissions, type HireContext } from "./hire";
import { notify } from "./notifications";

const DAY = 86_400_000;
const HOUR = 3_600_000;

export const verificationPieces = [
  "diploma",
  "transcript",
  "referent",
  "thesis",
  "certificate",
  "portfolio",
  "test",
] as const satisfies readonly VerificationPiece[];

/** Default deadline (document validé : 5 jours). */
export const VERIFICATION_DAYS = 5;
/** Reminders before the deadline: two days before, then the last half-day. */
export const REMINDER_OFFSETS = [2 * DAY, 12 * HOUR] as const;
export const PIECE_MAX_BYTES = 4 * 1024 * 1024;
const MESSAGE_MAX = 2000;

export class VerificationError extends Error {
  constructor(readonly code: "notFound" | "invalid" | "type" | "size" | "closed") {
    super(code);
    this.name = "VerificationError";
  }
}

export const requestSchema = z.object({
  applicationIds: z.array(z.string().min(1).max(60)).min(1).max(100),
  pieces: z
    .array(z.object({ kind: z.enum(verificationPieces), required: z.boolean() }))
    .min(1)
    .max(verificationPieces.length),
  dueAt: z.date(),
  message: z.string().trim().min(10).max(MESSAGE_MAX),
});
export type RequestInput = z.infer<typeof requestSchema>;

export type VerificationCheck =
  | { key: "school_not_in_cv"; values: { school: string } }
  | { key: "year_differs"; values: { cv: string; piece: string } };

/** A piece is in when it carries something, whatever its kind. */
export const received = (item: { receivedAt: Date | null }) => item.receivedAt !== null;

/** Is everything required sent? */
export function complete(items: readonly { required: boolean; receivedAt: Date | null }[]) {
  return items.every((item) => !item.required || received(item));
}

/**
 * Orbi's comparison of a diploma with the CV sent (pure): the school should appear in the CV, the
 * year of the profile's diploma should match the CV's. Only « à vérifier », never a verdict.
 */
export function coherenceChecks(input: {
  education: { school: string; endYear: number | null } | null;
  cvText: string;
}): VerificationCheck[] {
  const checks: VerificationCheck[] = [];
  const fold = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const cv = fold(input.cvText);
  if (input.education && input.cvText.trim()) {
    const school = fold(input.education.school).trim();
    if (school.length >= 3 && !cv.includes(school))
      checks.push({ key: "school_not_in_cv", values: { school: input.education.school } });
    // The years written near the school in the CV must include the diploma's year.
    const near = cv.indexOf(school);
    if (input.education.endYear && near >= 0) {
      const around = cv.slice(Math.max(0, near - 80), near + school.length + 80);
      const local = [...new Set([...around.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => m[0]))];
      if (local.length > 0 && !local.includes(String(input.education.endYear)))
        checks.push({
          key: "year_differs",
          values: { cv: local.join(", "), piece: String(input.education.endYear) },
        });
    }
  }
  return checks;
}

/** The CV sent with the application, as plain text, for the comparisons. */
function cvTextOf(snapshot: Prisma.JsonValue | null): string {
  if (!snapshot || typeof snapshot !== "object") return "";
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") parts.push(value);
    else if (typeof value === "number") parts.push(String(value));
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk((snapshot as Record<string, unknown>).content);
  return parts.join(" \n");
}

/**
 * « Demander des pièces »: one request per chosen application (active, of this offer, without a
 * request yet), then the message in the conversation and the notification. Returns what the e-mails
 * need, sent by the caller.
 */
export async function requestPieces(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  input: RequestInput,
  /** What the notification names (« des pièces pour vérifier votre candidature »). */
  documentName: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  if (input.dueAt.getTime() < now.getTime() + HOUR) throw new HireError("invalid");
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true },
  });
  const applications = await db.application.findMany({
    where: {
      id: { in: input.applicationIds },
      jobId: job.id,
      status: "active",
      verification: null,
    },
    select: {
      id: true,
      profile: { select: { user: { select: { id: true, email: true, firstName: true } } } },
    },
  });
  const sent: {
    applicationId: string;
    talent: { email: string; firstName: string | null };
    company: string;
    jobTitle: string;
    dueAt: Date;
  }[] = [];
  for (const application of applications) {
    await db.verificationRequest.create({
      data: {
        applicationId: application.id,
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        message: input.message,
        dueAt: input.dueAt,
        items: {
          create: input.pieces.map((piece) => ({ kind: piece.kind, required: piece.required })),
        },
      },
    });
    const conversation = await ensureApplicationConversation(db, application.id);
    if (!conversation.blockedAt) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: ctx.userId,
          kind: "text",
          body: input.message,
          payload: { verification: application.id },
          createdAt: now,
        },
      });
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: now, orgHiddenAt: null },
      });
    }
    await db.applicationEvent.create({
      data: {
        applicationId: application.id,
        actorId: ctx.userId,
        type: "verification_requested",
        payload: {
          pieces: input.pieces.map((piece) => piece.kind),
          dueAt: input.dueAt.toISOString(),
        },
        createdAt: now,
      },
    });
    const user = application.profile.user;
    await notify(db, {
      userIds: [user.id],
      type: "documentRequest",
      payload: { company: organization.name, documentName },
      href: piecesHref(application.id),
      actorId: ctx.userId,
    });
    sent.push({
      applicationId: application.id,
      talent: { email: user.email, firstName: user.firstName },
      company: organization.name,
      jobTitle: job.title,
      dueAt: input.dueAt,
    });
  }
  return sent;
}

export const piecesHref = (applicationId: string) =>
  `/app/jobs/candidatures/${applicationId}/pieces`;

/** The pieces of an offer, for the team: who sent what (« 3 sur 4 ont tout envoyé »). */
export async function verificationBoard(db: PrismaClient, ctx: HireContext, jobId: string) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const requests = await db.verificationRequest.findMany({
    where: { application: { jobId: job.id }, organizationId: ctx.organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      application: {
        select: {
          id: true,
          status: true,
          profile: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
  const done = requests.filter((request) => complete(request.items)).length;
  return { job, requests, done, total: requests.length };
}

/** The retained of an offer without a request yet (the default choice of « Demander »). */
export async function retainedWithoutPieces(db: PrismaClient, ctx: HireContext, jobId: string) {
  const job = await getOrgJob(db, ctx, jobId);
  return db.application.findMany({
    where: { jobId: job.id, status: "active", shortlistedAt: { not: null }, verification: null },
    orderBy: { shortlistedAt: "asc" },
    select: { id: true, profile: { select: { user: { select: { name: true } } } } },
  });
}

/** A file of a piece, for a member of the team of the offer; the opening is logged. */
export async function openPieceFile(
  db: PrismaClient,
  storage: FileStorage,
  ctx: HireContext,
  itemId: string,
) {
  const item = await db.verificationItem.findUnique({
    where: { id: itemId },
    include: { request: { select: { applicationId: true, organizationId: true } } },
  });
  if (!item?.fileKey || item.request.organizationId !== ctx.organizationId)
    throw new HireError("notFound");
  // Read through the offer's scope (team of the offer, golden rule n° 6).
  const application = await getOrgApplication(db, ctx, item.request.applicationId);
  const file = await storage.get(item.fileKey);
  if (!file) throw new HireError("notFound");
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "verification.view",
      targetType: "talentProfile",
      targetId: application.profileId,
      organizationId: ctx.organizationId,
      metadata: { applicationId: application.id, itemId: item.id },
    },
  });
  return { file, name: item.fileName ?? "piece" };
}

// ─── The candidate's side ─────────────────────────────────────────────────────────

/** The request of one of the person's applications, with what they can reuse. */
export async function myVerification(db: PrismaClient, userId: string, applicationId: string) {
  const request = await db.verificationRequest.findFirst({
    where: { applicationId, application: { profile: { userId } } },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      application: {
        select: {
          id: true,
          status: true,
          job: { select: { title: true, organization: { select: { name: true } } } },
        },
      },
    },
  });
  if (!request) return null;
  const [certificates, educations] = await Promise.all([
    db.certificate.findMany({
      where: { revokedAt: null, enrollment: { userId } },
      orderBy: { issuedAt: "desc" },
      select: { code: true, courseTitle: true },
    }),
    db.education.findMany({
      where: { profile: { userId } },
      orderBy: [{ endYear: { sort: "desc", nulls: "first" } }],
      select: { id: true, degree: true, school: true, endYear: true },
    }),
  ]);
  return { request, certificates, educations };
}

export const submitSchema = z.object({
  itemId: z.string().min(1).max(60),
  certificateCode: z.string().max(40).optional(),
  educationId: z.string().max(60).optional(),
  referentName: z.string().trim().max(120).optional(),
  referentEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional(),
});
export type SubmitInput = z.infer<typeof submitSchema> & {
  file?: { name: string; bytes: Uint8Array } | null;
};

/**
 * The candidate drops a piece: a file (PDF or image, 4 MB at most), an attestation reused from the
 * Skills Passport, a referent (name and e-mail, given with their agreement), or a link or a text.
 */
export async function submitPiece(
  db: PrismaClient,
  storage: FileStorage,
  userId: string,
  input: SubmitInput,
  now = new Date(),
) {
  const item = await db.verificationItem.findFirst({
    where: { id: input.itemId, request: { application: { profile: { userId } } } },
    include: {
      request: {
        include: {
          application: {
            select: {
              id: true,
              status: true,
              cvSnapshot: true,
            },
          },
        },
      },
    },
  });
  if (!item) throw new VerificationError("notFound");
  if (item.request.application.status !== "active") throw new VerificationError("closed");
  const data: Prisma.VerificationItemUpdateInput = {};
  if (input.file && input.file.bytes.byteLength > 0) {
    if (input.file.bytes.byteLength > PIECE_MAX_BYTES) throw new VerificationError("size");
    const type = sniffDocumentType(input.file.bytes);
    if (!type) throw new VerificationError("type");
    const key = `verification/${item.requestId}/${item.id}`;
    await storage.put(key, { contentType: type, bytes: input.file.bytes });
    data.fileKey = key;
    data.fileName = input.file.name.slice(0, 120) || "piece";
    data.contentType = type;
  }
  if (input.certificateCode) {
    const certificate = await db.certificate.findFirst({
      where: { code: input.certificateCode, revokedAt: null, enrollment: { userId } },
      select: { code: true },
    });
    if (!certificate) throw new VerificationError("invalid");
    data.certificateCode = certificate.code;
  }
  let education: { school: string; endYear: number | null } | null = null;
  if (input.educationId) {
    education = await db.education.findFirst({
      where: { id: input.educationId, profile: { userId } },
      select: { school: true, endYear: true },
    });
    if (!education) throw new VerificationError("invalid");
    data.educationId = input.educationId;
  }
  if (item.kind === "referent") {
    if (!input.referentName || !input.referentEmail) throw new VerificationError("invalid");
    data.referentName = input.referentName;
    data.referentEmail = input.referentEmail.toLowerCase();
  }
  if (input.note) data.note = input.note;
  const carries =
    data.fileKey ?? data.certificateCode ?? data.referentEmail ?? data.note ?? item.fileKey;
  if (!carries) throw new VerificationError("invalid");
  data.checks =
    item.kind === "diploma" || item.kind === "transcript"
      ? (coherenceChecks({
          education,
          cvText: cvTextOf(item.request.application.cvSnapshot),
        }) as unknown as Prisma.InputJsonValue)
      : [];
  data.receivedAt = now;
  await db.verificationItem.update({ where: { id: item.id }, data });
  await db.applicationEvent.create({
    data: {
      applicationId: item.request.application.id,
      actorId: userId,
      type: "verification_piece",
      payload: { kind: item.kind },
      createdAt: now,
    },
  });
  return { applicationId: item.request.application.id };
}

/**
 * Reminders (hourly task): two days before the deadline, then in its last half-day, to the
 * candidates who have not sent every required piece. Each reminder is claimed once.
 */
export async function runVerificationReminders(
  db: PrismaClient,
  documentName: string,
  now = new Date(),
) {
  const due = await db.verificationRequest.findMany({
    where: {
      remindersSent: { lt: REMINDER_OFFSETS.length },
      dueAt: { gt: now, lte: new Date(now.getTime() + REMINDER_OFFSETS[0]) },
      application: { status: "active" },
    },
    include: {
      items: { select: { required: true, receivedAt: true } },
      application: {
        select: {
          id: true,
          job: { select: { title: true, organization: { select: { name: true } } } },
          profile: { select: { user: { select: { id: true, email: true, firstName: true } } } },
        },
      },
    },
    take: 200,
  });
  const reminded: {
    talent: { email: string; firstName: string | null };
    company: string;
    jobTitle: string;
    dueAt: Date;
    applicationId: string;
  }[] = [];
  for (const request of due) {
    if (complete(request.items)) continue;
    const step = REMINDER_OFFSETS.findIndex(
      (offset, index) =>
        index >= request.remindersSent && request.dueAt.getTime() - now.getTime() <= offset,
    );
    if (step < 0 || step < request.remindersSent) continue;
    // Claimed once: another run that read the same row changes nothing.
    const claimed = await db.verificationRequest.updateMany({
      where: { id: request.id, remindersSent: request.remindersSent },
      data: { remindersSent: step + 1, lastReminderAt: now },
    });
    if (claimed.count === 0) continue;
    const { job, profile } = request.application;
    await notify(db, {
      userIds: [profile.user.id],
      type: "documentRequest",
      payload: { company: job.organization.name, documentName },
      href: piecesHref(request.application.id),
    });
    reminded.push({
      talent: { email: profile.user.email, firstName: profile.user.firstName },
      company: job.organization.name,
      jobTitle: job.title,
      dueAt: request.dueAt,
      applicationId: request.application.id,
    });
  }
  return reminded;
}

/** The default deadline for a request made now. */
export const defaultDueAt = (now = new Date()) => new Date(now.getTime() + VERIFICATION_DAYS * DAY);
