/**
 * E9 demo (local and preview only): a fictional foundation with a batch of sponsored Pro licences,
 * twelve fictional beneficiaries (enough to pass the anonymity threshold), a few codes and an
 * invitation link. Everything is obviously fictional (CLAUDE.md § 11).
 */
import type { SeedClient } from "./client";

export const PARTNER_SLUG = "demo-fondation-fictive";
const BATCH_NAME = "Promotion démo 2026 (fictive)";
const day = 86_400_000;
const BENEFICIARIES = 12;

export async function seedPartnerOrganization(db: SeedClient) {
  await db.organization.upsert({
    where: { slug: PARTNER_SLUG },
    update: {},
    create: {
      type: "partner",
      partnerKind: "foundation",
      name: "Fondation Démo (partenaire fictif)",
      slug: PARTNER_SLUG,
      description: "Fondation imaginaire, pour la démonstration de Jumanly Partners.",
      country: "RD Congo",
      city: "Kinshasa",
    },
  });
}

/** Same code every run, so that the demo and the tests can type it (JMLY-DEMO-…). */
const demoCodes = ["JMLYDEMOAAAA", "JMLYDEMOBBBB", "JMLYDEMOCCCC"];

export async function seedPartner(db: SeedClient) {
  const now = new Date();
  const org = await db.organization.findUniqueOrThrow({ where: { slug: PARTNER_SLUG } });
  const plan = await db.plan.findUniqueOrThrow({ where: { code: "talent_pro" } });

  // Start over: batches, their licences and the sponsored subscriptions they created.
  const old = await db.license.findMany({
    where: { batch: { partnerOrgId: org.id } },
    select: { subscriptionId: true },
  });
  await db.subscription.deleteMany({
    where: { id: { in: old.flatMap((row) => row.subscriptionId ?? []) } },
  });
  await db.licenseBatch.deleteMany({ where: { partnerOrgId: org.id } });

  const batch = await db.licenseBatch.create({
    data: {
      partnerOrgId: org.id,
      planId: plan.id,
      name: BATCH_NAME,
      seats: 40,
      months: 6,
      startsAt: new Date(now.getTime() - 60 * day),
      endsAt: new Date(now.getTime() + 300 * day),
      contractRef: "DEMO-CONTRAT-FICTIF",
      priceCents: 40 * 5 * 6 * 100,
      minGroup: 10,
    },
  });
  await db.license.createMany({
    data: demoCodes.map((code) => ({ batchId: batch.id, code, label: "Démo" })),
  });
  await db.licenseLink.create({
    data: { batchId: batch.id, token: "demo-lien-fictif", maxUses: 10 },
  });

  const courses = await db.course.findMany({
    where: { slug: { in: ["demo-reussir-son-cv", "demo-preparer-un-entretien"] } },
    select: { id: true },
  });
  for (let i = 1; i <= BENEFICIARIES; i++) {
    const email = `beneficiaire${String(i).padStart(2, "0")}@jumanly.test`;
    const activatedAt = new Date(now.getTime() - (50 - i) * day);
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Bénéficiaire ${i} Fictif`,
        firstName: "Bénéficiaire",
        lastName: `${i} Fictif`,
        emailVerified: true,
        country: "CD",
        termsAcceptedAt: now,
      },
    });
    const profile = await db.talentProfile.upsert({
      where: { userId: user.id },
      update: { completeness: i % 3 === 0 ? 60 : 85 },
      create: { userId: user.id, completeness: i % 3 === 0 ? 60 : 85 },
    });
    await db.subscription.deleteMany({ where: { subjectType: "user", subjectId: user.id } });
    const subscription = await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "sponsored",
        source: "license",
        currentPeriodStart: activatedAt,
        currentPeriodEnd: new Date(activatedAt.getTime() + 182 * day),
      },
    });
    await db.license.create({
      data: {
        batchId: batch.id,
        code: `JMLYBENE${String(i).padStart(4, "0")}`,
        userId: user.id,
        status: "active",
        activatedAt,
        subscriptionId: subscription.id,
        outcomeConsentAt: i % 2 === 0 ? activatedAt : null,
        outcomeConsentAnsweredAt: activatedAt,
      },
    });
    for (const [index, course] of courses.entries()) {
      const done = index === 0 || i % 2 === 0;
      await db.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        update: {},
        create: {
          userId: user.id,
          courseId: course.id,
          progress: done ? 100 : 40,
          startedAt: new Date(activatedAt.getTime() + day),
          completedAt: done ? new Date(activatedAt.getTime() + 10 * day) : null,
        },
      });
    }
    if ((await db.document.count({ where: { profileId: profile.id, kind: "cv" } })) === 0) {
      await db.document.create({
        data: {
          profileId: profile.id,
          kind: "cv",
          title: "CV (fictif)",
          isPrimary: true,
          createdAt: new Date(activatedAt.getTime() + 2 * day),
        },
      });
    }
  }
  console.log(
    `✓ Partenaire de démonstration : ${BENEFICIARIES} bénéficiaires fictifs, codes ${demoCodes.join(", ")}`,
  );
}
