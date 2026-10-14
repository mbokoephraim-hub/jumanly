/**
 * Public plans (docs/specifications.md, partie 05). Plans, prices and entitlements are read from the
 * database: this file never names a plan (CLAUDE.md § 2). It only reads entitlement keys.
 */
import type { PlanFamily, PrismaClient } from "@/generated/prisma/client";
import { signupHref } from "@/lib/signup";

export type PublicPlan = {
  code: string;
  family: PlanFamily;
  name: string;
  tagline: string;
  contentKey: string;
  priceCents: number | null;
  isPurchasable: boolean;
  recommended: boolean;
  entitlements: Record<string, string>;
};

export const planFamilies: PlanFamily[] = ["talent", "rh", "company", "partner"];

export async function listPublicPlans(db: PrismaClient): Promise<PublicPlan[]> {
  const plans = await db.plan.findMany({
    where: { isPublic: true, active: true },
    orderBy: [{ sortOrder: "asc" }],
    include: { entitlements: { select: { key: true, value: true } } },
  });
  return plans
    .map((plan) => ({
      code: plan.code,
      family: plan.family,
      name: plan.name,
      tagline: plan.tagline,
      contentKey: plan.contentKey,
      priceCents: plan.priceCents,
      isPurchasable: plan.isPurchasable,
      recommended: plan.recommended,
      entitlements: Object.fromEntries(plan.entitlements.map((e) => [e.key, e.value])),
    }))
    .sort((a, b) => planFamilies.indexOf(a.family) - planFamilies.indexOf(b.family));
}

export function plansOf(plans: PublicPlan[], family: PlanFamily) {
  return plans.filter((plan) => plan.family === family);
}

/** Highest monthly price of a family (cents), for "De 0 à {price} USD/mois". */
export function highestPrice(plans: PublicPlan[], family: PlanFamily): number | null {
  const prices = plansOf(plans, family)
    .map((plan) => plan.priceCents)
    .filter((price): price is number => price !== null && price > 0);
  return prices.length > 0 ? Math.max(...prices) : null;
}

/** Lowest paid monthly price of a family (cents), for "dès {price} USD/mois". */
export function lowestPaidPrice(plans: PublicPlan[], family: PlanFamily): number | null {
  const prices = plansOf(plans, family)
    .map((plan) => plan.priceCents)
    .filter((price): price is number => price !== null && price > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/** Integer entitlement value, or null for "contract" / missing. -1 means unlimited. */
export function limitOf(plan: PublicPlan, key: string): number | null {
  const value = plan.entitlements[key];
  if (value === undefined || !/^-?\d+$/.test(value)) return null;
  return Number(value);
}

export function isEnabled(plan: PublicPlan, key: string): boolean {
  return plan.entitlements[key] === "true";
}

export function levelOf(plan: PublicPlan, key: string): string {
  return plan.entitlements[key] ?? "none";
}

/** Where a plan's call to action leads: sign-up with the plan, a quote, or the partners form. */
export function planCtaHref(plan: PublicPlan): string {
  if (plan.family === "partner") return "/partenaires#contact";
  if (!plan.isPurchasable && plan.priceCents === null) return "/contact?sujet=devis";
  return signupHref({ profil: plan.family, forfait: plan.code });
}

/** Catalog levels in increasing order (entitlement `learn.catalog.level`, Course.requiredLevel). */
export const catalogLevels = [
  "free",
  "fundamentals",
  "standard",
  "advanced",
  "specialized",
] as const;
export type CatalogLevelCode = (typeof catalogLevels)[number];

export function catalogRank(level: string): number {
  return catalogLevels.indexOf(level as CatalogLevelCode);
}

/**
 * The cheapest talent plan whose `learn.catalog.level` opens a course of this level.
 * Null for a free course, or when no public plan opens it.
 */
export function planForCatalogLevel(plans: PublicPlan[], level: string): PublicPlan | null {
  if (level === "free") return null;
  const candidates = plansOf(plans, "talent")
    .filter((plan) => catalogRank(levelOf(plan, "learn.catalog.level")) >= catalogRank(level))
    .sort((a, b) => (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
  return candidates[0] ?? null;
}

/** Cheapest plan of a family whose limit for `key` reaches `min` (-1 = unlimited counts). */
export function cheapestPlanWithLimit(
  plans: PublicPlan[],
  family: PlanFamily,
  key: string,
  min: number,
): PublicPlan | null {
  const candidates = plansOf(plans, family)
    .filter((plan) => {
      const value = limitOf(plan, key);
      return value !== null && (value < 0 || value >= min);
    })
    .sort((a, b) => (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
  return candidates[0] ?? null;
}
