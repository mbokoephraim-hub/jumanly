/**
 * Locks of the Career tools and the plan put forward in the offer band of the Career home
 * (docs/refonte-career/BRIEF-CAREER-V2.md §§ 4 and 6). Plans are read from the database: no plan
 * is named here (CLAUDE.md § 2), only entitlement keys. Choice of the band's plan:
 * docs/decisions/2026-10-15-career-v2.md.
 */
import { PORTFOLIO_KEY } from "./portfolio";
import { plansOf, type PublicPlan } from "./plans";

export const lockableTools = ["documents", "linkedin", "interviews", "portfolio"] as const;
export type LockableTool = (typeof lockableTools)[number];

/** The entitlement that opens each lockable tool. */
export const toolGates: Record<LockableTool, string> = {
  documents: "career.documents",
  linkedin: "career.linkedin",
  interviews: "career.interview.text.monthly",
  portfolio: PORTFOLIO_KEY,
};

/** Whether a plan opens a tool: `true`, a level other than none, or a limit above zero. */
export function planOpens(plan: PublicPlan, tool: LockableTool): boolean {
  const value = plan.entitlements[toolGates[tool]];
  if (value === undefined) return false;
  return value !== "false" && value !== "0" && value !== "none";
}

const price = (plan: PublicPlan) => plan.priceCents ?? Infinity;

/** Paid talent plans, cheapest first. */
export function paidTalentPlans(plans: PublicPlan[]): PublicPlan[] {
  return plansOf(plans, "talent")
    .filter((plan) => plan.priceCents !== null && plan.priceCents > 0)
    .sort((a, b) => price(a) - price(b));
}

/** The cheapest paid talent plan that opens a tool, or null. */
export function planForTool(plans: PublicPlan[], tool: LockableTool): PublicPlan | null {
  return paidTalentPlans(plans).find((plan) => planOpens(plan, tool)) ?? null;
}

/** The first paid level gets the Sapin badge; the higher ones the Nuit badge. */
export function isEntryPlan(plans: PublicPlan[], plan: PublicPlan): boolean {
  return paidTalentPlans(plans)[0]?.code === plan.code;
}

/**
 * The plan of the offer band: the cheapest paid talent plan that opens at least one of the
 * locked tools (at the same price, the one that opens the most), with the locked tools it opens.
 * Null when nothing is locked or no plan opens a locked tool: then the band is not shown.
 */
export function upgradeOffer(
  plans: PublicPlan[],
  locked: LockableTool[],
): { plan: PublicPlan; tools: LockableTool[] } | null {
  if (locked.length === 0) return null;
  const candidates = paidTalentPlans(plans)
    .map((plan) => ({ plan, tools: locked.filter((tool) => planOpens(plan, tool)) }))
    .filter((item) => item.tools.length > 0)
    .sort((a, b) => price(a.plan) - price(b.plan) || b.tools.length - a.tools.length);
  return candidates[0] ?? null;
}
