import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";

/**
 * « Télécharger mes données » (partie 10): everything Jumanly holds about the person, as JSON.
 * Passwords, tokens and other people's data are never included.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const [profile, memberships, subscriptions, payments, sessions] = await Promise.all([
    db.talentProfile.findUnique({
      where: { userId: user.id },
      include: { skills: { include: { skill: { select: { name: true } } } } },
    }),
    db.membership.findMany({
      where: { userId: user.id },
      include: { organization: { select: { name: true, type: true } } },
    }),
    db.subscription.findMany({
      where: { subjectType: "user", subjectId: user.id },
      include: { plan: { select: { name: true } } },
    }),
    db.payment.findMany({
      where: { subjectType: "user", subjectId: user.id },
      omit: { idempotencyKey: true },
    }),
    db.session.findMany({
      where: { userId: user.id },
      select: { createdAt: true, expiresAt: true, userAgent: true, ipAddress: true },
    }),
  ]);
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
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
    },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="jumanly-mes-donnees.json"`,
      "Cache-Control": "no-store",
    },
  });
}
