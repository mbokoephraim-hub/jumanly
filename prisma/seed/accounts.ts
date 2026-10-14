/**
 * Demo accounts, local and preview only. Addresses use the reserved `.test` domain, so no e-mail can
 * ever reach a real person. One shared password, documented in docs/journal.md.
 */
import { hashPassword } from "better-auth/crypto";
import type { MembershipRole, PlatformRole } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";

export const DEMO_PASSWORD = "Demo-Jumanly-2026";

type AccountSeed = {
  email: string;
  firstName: string;
  lastName: string;
  platformRole?: PlatformRole;
  twoFactor?: boolean;
  /** Plan code of an active personal subscription. */
  plan?: string;
  organization?: { slug: string; role: MembershipRole };
};

const accounts: AccountSeed[] = [
  { email: "talent.free@jumanly.test", firstName: "Amani", lastName: "Fictif" },
  {
    email: "talent.pro@jumanly.test",
    firstName: "Bisimwa",
    lastName: "Fictif",
    plan: "talent_pro",
  },
  {
    email: "talent.starter@jumanly.test",
    firstName: "Fatou",
    lastName: "Fictive",
    plan: "talent_starter",
  },
  {
    email: "editeur@jumanly.test",
    firstName: "Gaël",
    lastName: "Fictif",
    platformRole: "content_editor",
  },
  {
    email: "rh@jumanly.test",
    firstName: "Chanelle",
    lastName: "Fictive",
    organization: { slug: "demo-cabinet-fictif", role: "org_owner" },
  },
  {
    email: "entreprise@jumanly.test",
    firstName: "Dieumerci",
    lastName: "Fictif",
    organization: { slug: "demo-horizon-fictive", role: "org_owner" },
  },
  {
    email: "admin@jumanly.test",
    firstName: "Esther",
    lastName: "Fictive",
    platformRole: "platform_admin",
    twoFactor: true,
  },
];

const day = 86_400_000;

export async function seedAccounts(db: SeedClient) {
  await db.organization.upsert({
    where: { slug: "demo-cabinet-fictif" },
    update: {},
    create: {
      type: "recruiter",
      name: "Cabinet Démo (cabinet fictif)",
      slug: "demo-cabinet-fictif",
      description: "Cabinet de recrutement imaginaire, pour la démonstration de Jumanly.",
      country: "RD Congo",
      city: "Lubumbashi",
    },
  });
  const password = await hashPassword(DEMO_PASSWORD);
  const now = new Date();

  for (const seed of accounts) {
    const data = {
      name: `${seed.firstName} ${seed.lastName}`,
      firstName: seed.firstName,
      lastName: seed.lastName,
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      platformRole: seed.platformRole ?? "user",
      twoFactorEnabled: seed.twoFactor ?? false,
      termsAcceptedAt: now,
      aiConsentAt: now,
    } as const;
    const user = await db.user.upsert({
      where: { email: seed.email },
      update: data,
      create: { email: seed.email, ...data },
    });
    await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
    await db.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password },
    });
    await db.talentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    if (seed.organization) {
      const org = await db.organization.findUniqueOrThrow({
        where: { slug: seed.organization.slug },
      });
      await db.membership.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
        update: { role: seed.organization.role, status: "active" },
        create: {
          organizationId: org.id,
          userId: user.id,
          role: seed.organization.role,
          status: "active",
        },
      });
    }

    await db.subscription.deleteMany({ where: { subjectType: "user", subjectId: user.id } });
    if (seed.plan) {
      const plan = await db.plan.findUniqueOrThrow({ where: { code: seed.plan } });
      await db.subscription.create({
        data: {
          subjectType: "user",
          subjectId: user.id,
          planId: plan.id,
          status: "active",
          source: "admin",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * day),
        },
      });
    }
  }
  console.log(`✓ ${accounts.length} comptes de démonstration (mot de passe : ${DEMO_PASSWORD})`);
}
