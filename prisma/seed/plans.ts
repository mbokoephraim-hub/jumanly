/**
 * Plans and their entitlement matrix: seed values from docs/specifications.md, partie 05 § 2 and § 3.
 * Valid in every environment. Afterwards, plans and entitlements are edited from Admin > Forfaits.
 *
 * Value conventions (PlanEntitlement.value is text):
 * - boolean: "true" | "false";
 * - level: the level code, "none" when the feature is not included;
 * - limit: an integer, "-1" = unlimited, "0" = none, "contract" = set by the organization's contract.
 * Numbers marked P in the spec are provisional: they stay editable by the admin.
 */
import type { EntitlementType, PlanFamily } from "../../src/generated/prisma/client";
import type { SeedClient } from "./client";

type PlanSeed = {
  code: string;
  family: PlanFamily;
  name: string;
  tagline: string;
  contentKey: string;
  priceCents: number | null;
  isPurchasable: boolean;
  recommended: boolean;
  sortOrder: number;
};

export const planSeeds: PlanSeed[] = [
  {
    code: "talent_free",
    family: "talent",
    name: "Free",
    tagline: "Pour découvrir Jumanly",
    contentKey: "pricing.talent.free",
    priceCents: 0,
    isPurchasable: false,
    recommended: false,
    sortOrder: 10,
  },
  {
    code: "talent_starter",
    family: "talent",
    name: "Starter",
    tagline: "Pour se lancer",
    contentKey: "pricing.talent.starter",
    priceCents: 490,
    isPurchasable: true,
    recommended: false,
    sortOrder: 20,
  },
  {
    code: "talent_pro",
    family: "talent",
    name: "Pro",
    tagline: "Pour accélérer sa carrière",
    contentKey: "pricing.talent.pro",
    priceCents: 1990,
    isPurchasable: true,
    recommended: true,
    sortOrder: 30,
  },
  {
    code: "talent_premium",
    family: "talent",
    name: "Premium",
    tagline: "Pour une préparation intensive",
    contentKey: "pricing.talent.premium",
    priceCents: 4990,
    isPurchasable: true,
    recommended: false,
    sortOrder: 40,
  },
  {
    code: "rh_free",
    family: "rh",
    name: "RH Free",
    tagline: "Pour découvrir le recrutement",
    contentKey: "pricing.rh.free",
    priceCents: 0,
    isPurchasable: false,
    recommended: false,
    sortOrder: 10,
  },
  {
    code: "rh_pro",
    family: "rh",
    name: "RH Pro",
    tagline: "Pour des besoins réguliers",
    contentKey: "pricing.rh.pro",
    priceCents: 1990,
    isPurchasable: true,
    recommended: true,
    sortOrder: 20,
  },
  {
    code: "rh_premium",
    family: "rh",
    name: "RH Premium",
    tagline: "Pour plusieurs recrutements simultanés",
    contentKey: "pricing.rh.premium",
    priceCents: 4990,
    isPurchasable: true,
    recommended: false,
    sortOrder: 30,
  },
  {
    code: "company",
    family: "company",
    name: "Company",
    tagline: "Pour les PME",
    contentKey: "pricing.company.base",
    priceCents: 7990,
    isPurchasable: true,
    recommended: false,
    sortOrder: 10,
  },
  {
    code: "company_plus",
    family: "company",
    name: "Company Plus",
    tagline: "Pour plusieurs équipes",
    contentKey: "pricing.company.plus",
    priceCents: 17990,
    isPurchasable: true,
    recommended: true,
    sortOrder: 20,
  },
  {
    code: "company_premium",
    family: "company",
    name: "Company Premium",
    tagline: "Pour les grands groupes",
    contentKey: "pricing.company.premium",
    priceCents: null,
    isPurchasable: false,
    recommended: false,
    sortOrder: 30,
  },
  {
    code: "partner",
    family: "partner",
    name: "Partners",
    tagline: "Licences financées par une institution",
    contentKey: "pricing.partners",
    priceCents: null,
    isPurchasable: false,
    recommended: false,
    sortOrder: 10,
  },
];

type Row = { key: string; type: EntitlementType; values: (string | number | boolean)[] };

const b = (key: string, ...values: boolean[]): Row => ({ key, type: "boolean", values });
const lv = (key: string, ...values: string[]): Row => ({ key, type: "level", values });
const lim = (key: string, ...values: (number | "contract")[]): Row => ({
  key,
  type: "limit",
  values,
});

/** Partie 05 § 3.1, columns: Free, Starter, Pro, Premium. */
const talentMatrix: { plans: string[]; rows: Row[] } = {
  plans: ["talent_free", "talent_starter", "talent_pro", "talent_premium"],
  rows: [
    b("jobs.apply", true, true, true, true),
    b("jobs.track", true, true, true, true),
    b("connect.messaging.application", true, true, true, true),
    lv("career.diagnostic.level", "simple", "personalized", "personalized", "personalized"),
    // CV templates included (docs/modeles-cv § 5.4): free < starter < pro.
    lv("career.cv.templates.access", "free", "starter", "pro", "pro"),
    b("career.cv.tailor", false, false, true, true),
    b("career.documents", false, true, true, true),
    b("career.linkedin", false, true, true, true),
    b("career.progress_plan", false, true, true, true),
    b("career.progress_plan.recommendations", false, false, true, true),
    lv("career.portfolio.level", "none", "none", "standard", "enriched"),
    b("career.tools.extended", false, false, true, true),
    lim("career.interview.text.monthly", 0, 3, 10, 25),
    lim("career.interview.voice.monthly", 0, 0, 3, 10),
    lv("learn.catalog.level", "free", "fundamentals", "standard", "advanced"),
    b("learn.exercises.job_specific", false, false, true, true),
    b("learn.resources.specialized", false, false, false, true),
    lim("ai.credits.monthly", 0, 30, 150, 500),
    b("reports.progress.detailed", false, false, false, true),
    b("support.priority", false, false, false, true),
  ],
};

/** Partie 05 § 3.2, columns: RH Free, RH Pro, RH Premium, Company, Company Plus, Company Premium. */
const hireMatrix: { plans: string[]; rows: Row[] } = {
  plans: ["rh_free", "rh_pro", "rh_premium", "company", "company_plus", "company_premium"],
  rows: [
    lim("org.seats", 1, 2, 3, 5, 15, "contract"),
    // Seats guaranteed at least, when the count is set by contract (Company Premium: "30 et plus").
    lim("org.seats.min", 1, 2, 3, 5, 15, 30),
    lim("jobs.active.max", 1, 5, 15, 20, 50, "contract"),
    lv("hire.pipeline.level", "simple", "multi", "advanced", "advanced", "advanced", "advanced"),
    lv("hire.talent_search", "none", "advanced", "deep", "advanced", "deep", "deep"),
    lim("hire.talent_search.monthly", 0, 100, 300, 300, 1000, "contract"),
    lim("hire.contact_requests.monthly", 0, 30, 100, 100, 300, "contract"),
    lv(
      "hire.matching.level",
      "none",
      "suggestions",
      "explainable",
      "explainable",
      "explainable",
      "explainable",
    ),
    b("hire.cv_analysis", false, true, true, true, true, true),
    b("hire.shortlist", false, true, true, true, true, true),
    b("hire.collaboration", false, false, true, true, true, true),
    b("hire.scorecards", false, false, true, true, true, true),
    b("hire.decision_history", false, false, true, true, true, true),
    b("connect.appointments", false, true, true, true, true, true),
    b("org.verified_profile", false, false, false, true, true, true),
    b("org.teams", false, false, false, false, true, true),
    b("org.entities", false, false, false, false, false, true),
    lv("org.permissions.level", "basic", "basic", "basic", "standard", "advanced", "advanced"),
    b("org.talent_pools.shared", false, false, false, false, true, true),
    lv("reports.level", "basic", "stats", "advanced", "advanced", "consolidated", "custom"),
    b("reports.export", false, false, false, false, true, true),
    b("hire.workflows.custom", false, false, false, false, false, true),
    b("integrations", false, false, false, false, false, true),
    lim("ai.credits.monthly", 0, 100, 300, 300, 1000, "contract"),
    // "contrat" for Company Premium: contractual support, at least priority.
    b("support.priority", false, false, true, false, true, true),
  ],
};

export function entitlementSeeds() {
  const result: { planCode: string; key: string; type: EntitlementType; value: string }[] = [];
  for (const matrix of [talentMatrix, hireMatrix]) {
    for (const row of matrix.rows) {
      if (row.values.length !== matrix.plans.length)
        throw new Error(`Matrice incomplète pour ${row.key}`);
      row.values.forEach((value, index) => {
        result.push({
          planCode: matrix.plans[index]!,
          key: row.key,
          type: row.type,
          value: String(value),
        });
      });
    }
  }
  return result;
}

/**
 * Creates missing plans and entitlements. Existing values are left alone, because the admin edits
 * them in production; SEED_PLANS_RESET=1 puts every value back to this file's matrix.
 */
export async function seedPlans(db: SeedClient) {
  const reset = process.env.SEED_PLANS_RESET === "1";
  for (const plan of planSeeds) {
    await db.plan.upsert({ where: { code: plan.code }, update: reset ? plan : {}, create: plan });
  }
  const plans = await db.plan.findMany({ select: { id: true, code: true } });
  const idByCode = new Map(plans.map((plan) => [plan.code, plan.id]));
  const entitlements = entitlementSeeds();
  for (const { planCode, key, type, value } of entitlements) {
    const planId = idByCode.get(planCode)!;
    await db.planEntitlement.upsert({
      where: { planId_key: { planId, key } },
      update: reset ? { type, value } : {},
      create: { planId, key, type, value },
    });
  }
  console.log(`Forfaits : ${planSeeds.length}, droits : ${entitlements.length}.`);
}
