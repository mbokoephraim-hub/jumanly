import { afterAll, describe, expect, it } from "vitest";
import { invalidate, resolvePlan } from "@/server/entitlements";
import { addMonths } from "@/server/entitlements/periods";
import { FakePaymentProvider } from "@/server/payments/fake";
import type { HireContext } from "@/server/services/hire";
import {
  orgBillingScreen,
  orgInvoice,
  orgPayment,
  scheduleOrgDowngrade,
} from "@/server/services/org-billing";
import { refreshPayment, startCheckout } from "@/server/services/subscriptions";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Étape 3 · A4 : Formule et facturation. Réservée au propriétaire et aux administrateurs ; chacun
// ne voit que la formule, les paiements et les factures de son organisation. Monter en gamme prend
// effet tout de suite ; réduire attend la fin de la période payée.

const users: string[] = [];
const orgs: string[] = [];
const DAY = 86_400_000;
const provider = new FakePaymentProvider();

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.membership.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function user() {
  const created = await newUser();
  users.push(created.id);
  return created;
}

/** A company paying `code`, ten days into its prepaid month, with an owner and an administrator. */
async function company(code = "company") {
  const org = await newOrganization("company");
  orgs.push(org.id);
  const [owner, admin, recruiter] = [await user(), await user(), await user()];
  await db.membership.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: "org_owner" },
      { userId: admin.id, organizationId: org.id, role: "org_admin" },
      { userId: recruiter.id, organizationId: org.id, role: "recruiter" },
    ],
  });
  const plan = await db.plan.findUniqueOrThrow({ where: { code } });
  const start = new Date(Date.now() - 10 * DAY);
  await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: org.id,
      planId: plan.id,
      status: "active",
      source: "self",
      currentPeriodStart: start,
      currentPeriodEnd: addMonths(start, 1),
    },
  });
  invalidate();
  const ctx = (userId: string, role: HireContext["role"]): HireContext => ({
    userId,
    organizationId: org.id,
    role,
  });
  return {
    org,
    owner: ctx(owner.id, "org_owner"),
    admin: ctx(admin.id, "org_admin"),
    recruiter: ctx(recruiter.id, "recruiter"),
    viewer: ctx(recruiter.id, "viewer"),
    email: admin.email,
  };
}

describe("Formule et facturation", () => {
  it("montre la formule, l'usage et les formules Company sans jamais lire un nom de formule", async () => {
    const { admin } = await company();
    const screen = await orgBillingScreen(db, admin);
    expect(screen.plan.code).toBe("company");
    expect(screen.paidUntil).not.toBeNull();
    expect(screen.gauges.seats).toEqual({ used: 3, max: 5 });
    expect(screen.gauges.search.max).toBe(300);
    const actions = Object.fromEntries(screen.plans.map((plan) => [plan.code, plan.action]));
    expect(actions).toEqual({
      company: "current",
      company_plus: "upgrade",
      company_premium: "quote",
    });
    const plus = screen.plans.find((plan) => plan.code === "company_plus")!;
    // Upgrade: the unused days of the current plan are deducted.
    expect(plus.creditCents).toBeGreaterThan(0);
    expect(plus.totalCents).toBe((plus.priceCents ?? 0) - plus.creditCents);
    expect(screen.plans.find((plan) => plan.code === "company_premium")?.users).toEqual({
      count: 30,
      more: true,
    });
    expect(screen.renewal?.totalCents).toBe(7990);
  });

  it("refuse l'écran, le changement de formule et les factures au recruteur et au lecteur", async () => {
    const { recruiter, viewer } = await company();
    for (const ctx of [recruiter, viewer]) {
      await expect(orgBillingScreen(db, ctx)).rejects.toThrow("forbidden");
      await expect(scheduleOrgDowngrade(db, ctx, null)).rejects.toThrow("forbidden");
      await expect(orgInvoice(db, ctx, "x")).rejects.toThrow("forbidden");
      await expect(orgPayment(db, ctx, "x")).rejects.toThrow("forbidden");
    }
  });

  it("monte en gamme tout de suite, après le paiement d'un administrateur", async () => {
    const { org, admin, email } = await company();
    const subject = { type: "organization" as const, id: org.id };
    const started = await startCheckout(db, provider, {
      subject,
      planCode: "company_plus",
      method: "card",
      payerId: admin.userId,
      email,
      country: "CD",
      returnUrl: "http://localhost/app/organisation/facturation",
    });
    expect(started.status).toBe("started");
    const paymentId = started.status === "started" ? started.paymentId : "";
    await refreshPayment(db, provider, paymentId);
    invalidate();
    expect((await resolvePlan(db, subject))?.planCode).toBe("company_plus");
    const screen = await orgBillingScreen(db, admin);
    expect(screen.plan.code).toBe("company_plus");
    expect(screen.invoices).toHaveLength(1);
    expect(screen.invoices[0]?.method).toBe("card");
    expect(screen.plans.find((plan) => plan.code === "company")?.action).toBe("downgrade");
    expect(await orgInvoice(db, admin, screen.invoices[0]!.id)).not.toBeNull();
  });

  it("réduit à la fin de la période payée, et le note au journal", async () => {
    const { org, owner } = await company("company_plus");
    const before = await db.subscription.findFirstOrThrow({ where: { subjectId: org.id } });
    const result = await scheduleOrgDowngrade(db, owner, "company");
    expect(result?.until.getTime()).toBe(before.currentPeriodEnd.getTime());
    invalidate();
    // Still the current plan until the end of the period.
    const screen = await orgBillingScreen(db, owner);
    expect(screen.plan.code).toBe("company_plus");
    expect(screen.pendingPlan?.name).toBeTruthy();
    expect(screen.plans.find((plan) => plan.code === "company")?.action).toBe("scheduled");
    // A dearer plan is never « scheduled »: it is paid.
    expect(await scheduleOrgDowngrade(db, owner, "company_premium")).toBeNull();
    await scheduleOrgDowngrade(db, owner, null);
    expect(
      await db.auditLog.findMany({
        where: { organizationId: org.id, action: { startsWith: "org.plan." } },
        select: { action: true },
        orderBy: { createdAt: "asc" },
      }),
    ).toEqual([
      { action: "org.plan.downgrade_scheduled" },
      { action: "org.plan.downgrade_canceled" },
    ]);
  });

  it("ne montre ni les paiements ni les factures d'une autre organisation", async () => {
    const mine = await company();
    const other = await company();
    const subject = { type: "organization" as const, id: other.org.id };
    const started = await startCheckout(db, provider, {
      subject,
      planCode: "company",
      method: "card",
      payerId: other.admin.userId,
      email: other.email,
      country: "CD",
      returnUrl: "http://localhost/app/organisation/facturation",
    });
    const paymentId = started.status === "started" ? started.paymentId : "";
    await refreshPayment(db, provider, paymentId);
    const invoice = await db.invoice.findFirstOrThrow({ where: { paymentId } });
    expect(await orgPayment(db, mine.admin, paymentId)).toBeNull();
    expect(await orgInvoice(db, mine.admin, invoice.id)).toBeNull();
    expect((await orgBillingScreen(db, mine.admin)).invoices).toHaveLength(0);
    expect(await orgInvoice(db, other.owner, invoice.id)).not.toBeNull();
  });
});
