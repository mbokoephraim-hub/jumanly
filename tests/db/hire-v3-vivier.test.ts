import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate } from "@/server/entitlements";
import { HireError, type HireContext } from "@/server/services/hire";
import { toggleVivierFavorite, vivierV3 } from "@/server/services/hire-v3-vivier";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;

afterAll(async () => {
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

/** An organization whose plan opens the pools (`hire.shortlist`, never a plan name). */
async function org() {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  const plan = await db.plan.findFirstOrThrow({
    where: {
      family: { in: ["rh", "company"] },
      entitlements: { some: { key: "hire.shortlist", value: "true" } },
    },
    orderBy: { sortOrder: "asc" },
  });
  const now = new Date();
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: organization.id,
      planId: plan.id,
      status: "active",
      source: "admin",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * DAY),
    },
  });
  return organization;
}

async function owner(organizationId: string): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role: "org_owner" } });
  return { userId: user.id, organizationId, role: "org_owner" };
}

async function talent(city: string) {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({ where: { id: user.id }, data: { city } });
  return db.talentProfile.create({
    data: { userId: user.id, visibility: "recruiters", availability: "open" },
  });
}

describe("Vivier v3 (favoris, relances, accord)", () => {
  it("marks favourites, counts pending invitations and the consents to renew", async () => {
    const organization = await org();
    const ctx = await owner(organization.id);
    const now = new Date();
    const [a, b] = await Promise.all([talent("Kinshasa"), talent("Goma")]);
    const pool = await db.talentPool.create({
      data: { organizationId: organization.id, name: "Data", visibility: "org" },
    });
    await db.talentPoolEntry.createMany({
      data: [
        { poolId: pool.id, profileId: a.id, createdAt: new Date(now.getTime() - 700 * DAY) },
        { poolId: pool.id, profileId: b.id },
      ],
    });
    await db.contactRequest.create({
      data: {
        organizationId: organization.id,
        requesterId: ctx.userId,
        profileId: b.id,
        message: "Bonjour",
        expiresAt: new Date(now.getTime() + 10 * DAY),
        createdAt: new Date(now.getTime() - 3 * DAY),
      },
    });

    expect(await toggleVivierFavorite(db, ctx, a.id, now)).toBe(true);
    const data = await vivierV3(db, ctx, now);
    expect(data).not.toBeNull();
    const byId = new Map(data!.talents.map((t) => [t.profileId, t]));
    expect(byId.get(a.id)).toMatchObject({ favorite: true, renewSoon: true, city: "Kinshasa" });
    expect(byId.get(b.id)).toMatchObject({ favorite: false, relanceDays: 3, renewSoon: false });
    expect(data).toMatchObject({ favorites: 1, relances: 1, renew: 1 });
    expect(data!.cities).toEqual(["Goma", "Kinshasa"]);

    expect(await toggleVivierFavorite(db, ctx, a.id, now)).toBe(false);
    expect((await vivierV3(db, ctx, now))!.favorites).toBe(0);
  });

  it("refuses a talent outside the organization's pools", async () => {
    const organization = await org();
    const ctx = await owner(organization.id);
    const outsider = await talent("Kinshasa");
    await expect(toggleVivierFavorite(db, ctx, outsider.id)).rejects.toBeInstanceOf(HireError);
  });
});
