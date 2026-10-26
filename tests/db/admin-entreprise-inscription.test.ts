import { afterAll, describe, expect, it } from "vitest";
import {
  finishAdminSignup,
  inviteSignupTeam,
  normalizeWebsite,
  saveBannerTheme,
  saveSignupCompany,
  saveSignupRole,
  signupContext,
  signupPlanChoices,
  teamPlan,
} from "@/server/services/admin-signup";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Étape 3 · A1 : inscription de l'administrateur d'entreprise. Chaque écriture reste dans
// l'organisation que la personne a créée ; les invitations respectent les places de la formule.

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.invitation.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.organizationDocument.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function company(planCode?: string) {
  const owner = await newUser();
  users.push(owner.id);
  const org = await newOrganization("company");
  orgs.push(org.id);
  await db.membership.create({
    data: { userId: owner.id, organizationId: org.id, role: "org_owner" },
  });
  if (planCode) {
    const plan = await db.plan.findUniqueOrThrow({ where: { code: planCode } });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "organization",
        subjectId: org.id,
        planId: plan.id,
        status: "active",
        source: "self",
        currentPeriodStart: new Date(now.getTime() - DAY),
        currentPeriodEnd: new Date(now.getTime() + 30 * DAY),
      },
    });
  }
  const signup = await signupContext(db, owner.id);
  return { owner, org, ctx: signup!.ctx };
}

describe("inscription de l'administrateur d'entreprise", () => {
  it("propose RH Free puis les formules Company, et suggère la moins chère pour l'équipe", async () => {
    const plans = await db.plan.findMany({ where: { active: true, isPublic: true } });
    const choices = signupPlanChoices(plans);
    expect(choices[0]).toMatchObject({ family: "rh", priceCents: 0 });
    expect(choices.slice(1).every((plan) => plan.family === "company")).toBe(true);
    const suggested = teamPlan(choices)!;
    expect(suggested.family).toBe("company");
    expect(
      choices.every((plan) => !plan.priceCents || plan.priceCents >= suggested.priceCents!),
    ).toBe(true);
  });

  it("ne trouve que l'organisation que la personne possède", async () => {
    const recruiter = await newUser();
    users.push(recruiter.id);
    const { org } = await company();
    await db.membership.create({
      data: { userId: recruiter.id, organizationId: org.id, role: "recruiter" },
    });
    // Un membre qui n'est pas propriétaire ne reprend pas l'inscription d'une autre entreprise.
    expect(await signupContext(db, recruiter.id)).toBeNull();
  });

  it("enregistre le rôle, l'entreprise et la bannière dans sa seule organisation", async () => {
    const mine = await company();
    const other = await company();
    expect(await saveSignupRole(db, mine.ctx, "Responsable RH")).toBe(true);
    expect(await saveSignupRole(db, mine.ctx, " ")).toBe(false);
    expect(
      await saveSignupCompany(db, mine.ctx, {
        sector: "Fintech",
        size: "m",
        city: "Kinshasa",
        website: "baobab-fictive.cd",
        description: "Exemple fictif.",
      }),
    ).toEqual({ ok: true });
    expect(
      await saveSignupCompany(db, mine.ctx, { sector: "Fintech", size: "m", city: "" }),
    ).toEqual({ ok: false, error: "required" });
    expect(
      await saveSignupCompany(db, mine.ctx, {
        sector: "Fintech",
        size: "m",
        city: "Kinshasa",
        website: "pas un site",
      }),
    ).toEqual({ ok: false, error: "website" });
    expect(await saveBannerTheme(db, mine.ctx, "nuit")).toBe(true);
    expect(await saveBannerTheme(db, mine.ctx, "rouge")).toBe(false);

    const saved = await db.organization.findUniqueOrThrow({ where: { id: mine.org.id } });
    expect(saved).toMatchObject({
      sector: "Fintech",
      size: "51-200",
      city: "Kinshasa",
      website: "https://baobab-fictive.cd",
      bannerTheme: "nuit",
    });
    const untouched = await db.organization.findUniqueOrThrow({ where: { id: other.org.id } });
    expect(untouched).toMatchObject({ sector: null, city: null, bannerTheme: null });
    const membership = await db.membership.findFirstOrThrow({
      where: { organizationId: mine.org.id, userId: mine.owner.id },
    });
    expect(membership.jobTitle).toBe("Responsable RH");
  });

  it("normalise l'adresse du site", () => {
    expect(normalizeWebsite("")).toBe("");
    expect(normalizeWebsite("https://exemple.cd/")).toBe("https://exemple.cd");
    expect(normalizeWebsite("exemple")).toBeNull();
  });

  it("invite l'équipe dans les places de la formule, rôle par rôle", async () => {
    const { org, ctx } = await company("company");
    const list = [
      { email: "nadia.fictive@exemple.cd", role: "recruiter" },
      { email: "aline.fictive@exemple.cd", role: "hiring_manager" },
      { email: "patrice.fictif@exemple.cd", role: "viewer" },
    ];
    const result = await inviteSignupTeam(db, ctx, list);
    expect(result.ok).toBe(true);
    const invitations = await db.invitation.findMany({ where: { organizationId: org.id } });
    expect(invitations.map((item) => [item.email, item.role]).sort()).toEqual(
      list.map((item) => [item.email, item.role]).sort(),
    );
    // Company : 5 places, 1 propriétaire + 3 invitations, il en reste une.
    expect(
      await inviteSignupTeam(db, ctx, [
        { email: "a.fictif@exemple.cd", role: "recruiter" },
        { email: "b.fictif@exemple.cd", role: "recruiter" },
      ]),
    ).toEqual({ ok: false, error: "seats" });
    expect(
      await inviteSignupTeam(db, ctx, [
        { email: "c.fictif@exemple.cd", role: "recruiter" },
        { email: "c.fictif@exemple.cd", role: "viewer" },
      ]),
    ).toEqual({ ok: false, error: "duplicate" });
    expect(
      await inviteSignupTeam(db, ctx, [{ email: "pas-une-adresse", role: "recruiter" }]),
    ).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("RH Free ne compte qu'un utilisateur : aucune invitation", async () => {
    const { org, ctx } = await company();
    expect(
      await inviteSignupTeam(db, ctx, [{ email: "d.fictif@exemple.cd", role: "recruiter" }]),
    ).toEqual({ ok: false, error: "seats" });
    expect(await db.invitation.count({ where: { organizationId: org.id } })).toBe(0);
    expect(await inviteSignupTeam(db, ctx, [])).toEqual({ ok: true, invitations: [] });
  });

  it("fait de la pièce jointe une demande de vérification quand la formule l'inclut", async () => {
    const texts = { registration: "Document joint à l'inscription", mandate: "Administrateur" };
    const free = await company();
    const paid = await company("company");
    for (const item of [free, paid]) {
      await db.organizationDocument.create({
        data: {
          organizationId: item.org.id,
          storageKey: `test/${item.org.id}`,
          name: "registre-fictif.pdf",
          contentType: "application/pdf",
          size: 9,
        },
      });
    }
    // Sans document, rien n'est demandé.
    const empty = await company("company");
    expect(await finishAdminSignup(db, empty.ctx, texts, "admin@exemple.cd")).toBe(false);
    const canFree = await finishAdminSignup(db, free.ctx, texts, "admin@exemple.cd");
    const canPaid = await finishAdminSignup(db, paid.ctx, texts, "admin@exemple.cd");
    expect(canPaid).toBe(true);
    const status = await db.organization.findUniqueOrThrow({
      where: { id: paid.org.id },
      select: { verificationStatus: true },
    });
    expect(status.verificationStatus).toBe("pending");
    const freeStatus = await db.organization.findUniqueOrThrow({
      where: { id: free.org.id },
      select: { verificationStatus: true },
    });
    expect(freeStatus.verificationStatus).toBe(canFree ? "pending" : "none");
  });
});
