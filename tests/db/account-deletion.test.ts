import { afterAll, describe, expect, it } from "vitest";
import {
  AccountDeletionError,
  eraseAccount,
  ownedOrganizations,
} from "@/server/services/account-deletion";
import { setupAccount } from "@/server/services/accounts";
import { createPost } from "@/server/services/feed";
import { cleanup, db, newUser } from "./helpers";

// « Supprimer mon compte » (Ephraïm, 22/10/2026): at once, everything, the e-mail free again.
const users: string[] = [];
const orgs: string[] = [];
const labels = { work: "Réalisation", certificate: () => "Attestation" };

afterAll(async () => {
  await cleanup(users, orgs);
  await db.$disconnect();
});

describe("Suppression du compte", () => {
  it("efface tout, garde les paiements sans lien, et libère l'adresse e-mail", async () => {
    const user = await newUser();
    const other = await newUser();
    users.push(user.id, other.id);
    const profile = await db.talentProfile.create({
      data: { userId: user.id, headline: "Profil fictif" },
    });
    await db.experience.create({
      data: {
        profileId: profile.id,
        title: "Poste fictif",
        company: "Fictive",
        startDate: new Date(),
      },
    });
    const post = await createPost(db, user.id, { body: "Une nouvelle fictive" }, labels);
    const connection = await db.connection.create({
      data: { requesterId: user.id, addresseeId: other.id, status: "accepted" },
    });
    const plan = await db.plan.findFirstOrThrow({
      where: { family: "talent", priceCents: { gt: 0 } },
    });
    const now = new Date();
    const subscription = await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      },
    });
    const payment = await db.payment.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        subscriptionId: subscription.id,
        provider: "fake",
        method: "mobile_money",
        amountCents: 500,
        status: "succeeded",
        providerRef: `test-${user.id}`,
        idempotencyKey: `test-${user.id}`,
        periodStart: now,
        periodEnd: subscription.currentPeriodEnd,
      },
    });

    await eraseAccount(db, user.id);

    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await db.talentProfile.findUnique({ where: { id: profile.id } })).toBeNull();
    expect(await db.experience.count({ where: { profileId: profile.id } })).toBe(0);
    expect(await db.feedPost.findUnique({ where: { id: post } })).toBeNull();
    expect(await db.connection.findUnique({ where: { id: connection.id } })).toBeNull();
    expect(await db.subscription.count({ where: { subjectId: user.id } })).toBe(0);
    // Accounting keeps the payment, linked to nobody that still exists.
    const kept = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(kept.subscriptionId).toBeNull();

    // The same e-mail signs up again as a brand-new account, with nothing from before.
    const again = await db.user.create({
      data: { email: user.email, name: "Test Fictif", emailVerified: true },
    });
    users.push(again.id);
    expect(again.id).not.toBe(user.id);
    expect(await db.talentProfile.findUnique({ where: { userId: again.id } })).toBeNull();
    expect(await db.subscription.count({ where: { subjectId: again.id } })).toBe(0);
  });

  it("emporte l'espace recruteur vide, mais pas une organisation qui a des offres", async () => {
    const user = await newUser();
    users.push(user.id);
    const org = await setupAccount(db, user.id, { profile: "rh", orgName: "Cabinet fictif" });
    expect(org).not.toBeNull();
    expect((await ownedOrganizations(db, user.id)).blocking).toBeNull();

    const owner = await newUser();
    users.push(owner.id);
    const busy = await setupAccount(db, owner.id, { profile: "rh", orgName: "Cabinet occupé" });
    orgs.push(busy!.id);
    const job = await db.job.create({
      data: {
        organizationId: busy!.id,
        title: "Offre fictive",
        slug: `test-${owner.id}`,
        description: "Offre fictive de test.",
        contractType: "cdi",
        city: "Kinshasa",
        country: "CD",
        remote: "onsite",
      },
    });
    await expect(eraseAccount(db, owner.id)).rejects.toBeInstanceOf(AccountDeletionError);
    expect(await db.user.findUnique({ where: { id: owner.id } })).not.toBeNull();
    await db.job.delete({ where: { id: job.id } });

    await eraseAccount(db, user.id);
    expect(await db.organization.findUnique({ where: { id: org!.id } })).toBeNull();
  });
});
