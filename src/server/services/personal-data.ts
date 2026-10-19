/**
 * « Télécharger mes données » (partie 10, droit d'accès): everything Jumanly holds about a person,
 * as JSON. Shared by the person's own export (`/app/parametres/export`) and the administrator's
 * (Admin v2, étape 3). Passwords, tokens and other people's data are never included.
 */
import type { PrismaClient } from "@/generated/prisma/client";

export async function personalData(db: PrismaClient, userId: string, now = new Date()) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const [profile, memberships, subscriptions, payments, sessions, enrollments, orbi] =
    await Promise.all([
      db.talentProfile.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: { select: { name: true } } } },
          experiences: true,
          educations: true,
          documents: { select: { kind: true, title: true, content: true, createdAt: true } },
          applications: {
            select: {
              createdAt: true,
              status: true,
              coverLetter: true,
              job: { select: { title: true } },
            },
          },
        },
      }),
      db.membership.findMany({
        where: { userId },
        include: { organization: { select: { name: true, type: true } } },
      }),
      db.subscription.findMany({
        where: { subjectType: "user", subjectId: userId },
        include: { plan: { select: { name: true } } },
      }),
      db.payment.findMany({
        where: { subjectType: "user", subjectId: userId },
        omit: { idempotencyKey: true },
      }),
      db.session.findMany({
        where: { userId },
        select: { createdAt: true, expiresAt: true, userAgent: true, ipAddress: true },
      }),
      db.enrollment.findMany({
        where: { userId },
        select: {
          startedAt: true,
          completedAt: true,
          course: { select: { title: true } },
          certificate: { select: { code: true, issuedAt: true, revokedAt: true } },
        },
      }),
      db.orbiConversation.findMany({
        where: { userId },
        select: {
          title: true,
          createdAt: true,
          messages: {
            select: { role: true, text: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
    ]);
  return {
    exportedAt: now.toISOString(),
    account: {
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      city: user.city,
      createdAt: user.createdAt,
      aiConsentAt: user.aiConsentAt,
      newsletter: user.newsletter,
      termsAcceptedAt: user.termsAcceptedAt,
    },
    profile,
    memberships,
    subscriptions,
    payments,
    sessions,
    enrollments,
    orbi,
  };
}

export function personalDataResponseInit(fileName: string): ResponseInit {
  return {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  };
}
