/**
 * Comparison tables of /tarifs (textes, partie 05 « Comparatif »). Every cell is computed from the
 * plan's entitlements read in the database: change a value in the admin and the table follows.
 * Labels are text keys under `pricing.<family>.compare`.
 */
import type { PlanFamily } from "@/generated/prisma/client";
import { isEnabled, levelOf, limitOf, type PublicPlan } from "@/server/services/plans";

export type CompareCell =
  | { kind: "check" }
  | { kind: "dash" }
  | { kind: "text"; key: string; values?: Record<string, string | number> }
  | { kind: "value"; value: string };

export type CompareRow = { label: string; cell: (plan: PublicPlan) => CompareCell };

const check = (on: boolean): CompareCell => (on ? { kind: "check" } : { kind: "dash" });
const text = (key: string, values?: Record<string, string | number>): CompareCell => ({
  kind: "text",
  key,
  values,
});
const isContract = (plan: PublicPlan, key: string) => plan.entitlements[key] === "contract";

/** Monthly quota as text, a dash when it is 0, the contract text when negotiated. */
function quota(plan: PublicPlan, key: string, textKey: string, contractKey?: string): CompareCell {
  if (isContract(plan, key)) return contractKey ? text(contractKey) : { kind: "dash" };
  const value = limitOf(plan, key) ?? 0;
  if (value === 0) return { kind: "dash" };
  return value < 0 ? text("ui.unlimited") : text(textKey, { quota: value });
}

const talent: CompareRow[] = [
  { label: "apply", cell: (p) => check(isEnabled(p, "jobs.apply")) },
  { label: "messaging", cell: (p) => check(isEnabled(p, "connect.messaging.application")) },
  {
    label: "diagnostic.text",
    cell: (p) => text(`diagnostic.${levelOf(p, "career.diagnostic.level")}`),
  },
  { label: "trainings.text", cell: (p) => text(`trainings.${levelOf(p, "learn.catalog.level")}`) },
  {
    label: "cv.text",
    cell: (p) =>
      isEnabled(p, "career.cv.tailor")
        ? text("cv.tailored")
        : text(`cv.${levelOf(p, "career.cv.templates.access")}`),
  },
  {
    label: "documents",
    cell: (p) => check(isEnabled(p, "career.documents") && isEnabled(p, "career.linkedin")),
  },
  { label: "ai.text", cell: (p) => quota(p, "ai.credits.monthly", "ai.monthly") },
  {
    label: "interviewText",
    cell: (p) => quota(p, "career.interview.text.monthly", "interview.monthly"),
  },
  {
    label: "interviewVoice",
    cell: (p) => quota(p, "career.interview.voice.monthly", "interview.monthly"),
  },
  {
    label: "plan.text",
    cell: (p) =>
      !isEnabled(p, "career.progress_plan")
        ? { kind: "dash" }
        : isEnabled(p, "reports.progress.detailed")
          ? text("plan.reports")
          : isEnabled(p, "career.progress_plan.recommendations")
            ? text("plan.reco")
            : text("plan.base"),
  },
  { label: "exercises", cell: (p) => check(isEnabled(p, "learn.exercises.job_specific")) },
  {
    label: "portfolio.text",
    cell: (p) => {
      const level = levelOf(p, "career.portfolio.level");
      return level === "none" ? { kind: "dash" } : text(`portfolio.${level}`);
    },
  },
  {
    label: "support.text",
    cell: (p) => text(isEnabled(p, "support.priority") ? "support.priority" : "support.standard"),
  },
];

const rh: CompareRow[] = [
  {
    label: "seats",
    cell: (p) => ({ kind: "value", value: String(limitOf(p, "org.seats") ?? "") }),
  },
  {
    label: "jobs",
    cell: (p) => ({ kind: "value", value: String(limitOf(p, "jobs.active.max") ?? "") }),
  },
  { label: "applications", cell: (p) => check(levelOf(p, "hire.pipeline.level") !== "none") },
  { label: "pipeline.text", cell: (p) => text(`pipeline.${levelOf(p, "hire.pipeline.level")}`) },
  {
    label: "search.text",
    cell: (p) => {
      const level = levelOf(p, "hire.talent_search");
      return level === "none"
        ? { kind: "dash" }
        : text(`search.${level}`, { quota: limitOf(p, "hire.talent_search.monthly") ?? 0 });
    },
  },
  {
    label: "contacts.text",
    cell: (p) => quota(p, "hire.contact_requests.monthly", "contacts.monthly"),
  },
  {
    label: "matching.text",
    cell: (p) => {
      const level = levelOf(p, "hire.matching.level");
      return level === "none" ? { kind: "dash" } : text(`matching.${level}`);
    },
  },
  { label: "cvAnalysis", cell: (p) => check(isEnabled(p, "hire.cv_analysis")) },
  { label: "shortlist", cell: (p) => check(isEnabled(p, "hire.shortlist")) },
  {
    label: "messaging.text",
    cell: (p) =>
      text(
        isEnabled(p, "connect.appointments") ? "messaging.appointments" : "messaging.applications",
      ),
  },
  { label: "collaboration", cell: (p) => check(isEnabled(p, "hire.collaboration")) },
  {
    label: "scorecards",
    cell: (p) => check(isEnabled(p, "hire.scorecards") && isEnabled(p, "hire.decision_history")),
  },
  { label: "reports.text", cell: (p) => text(`reports.${levelOf(p, "reports.level")}`) },
  { label: "ai.text", cell: (p) => quota(p, "ai.credits.monthly", "ai.monthly") },
  {
    label: "support.text",
    cell: (p) => text(isEnabled(p, "support.priority") ? "support.priority" : "support.standard"),
  },
];

/** Company reports levels → texts of the Companies comparison. */
const companyReports: Record<string, string> = {
  advanced: "stats",
  consolidated: "consolidated",
  custom: "custom",
};
const companyDashboards: Record<string, string> = {
  advanced: "shared",
  consolidated: "team",
  custom: "custom",
};

const company: CompareRow[] = [
  {
    label: "seats.text",
    cell: (p) =>
      isContract(p, "org.seats")
        ? text("seats.contract", { seats: limitOf(p, "org.seats.min") ?? 0 })
        : { kind: "value", value: String(limitOf(p, "org.seats") ?? "") },
  },
  {
    label: "jobs.text",
    cell: (p) =>
      isContract(p, "jobs.active.max")
        ? text("jobs.negotiated")
        : { kind: "value", value: String(limitOf(p, "jobs.active.max") ?? "") },
  },
  { label: "verified", cell: (p) => check(isEnabled(p, "org.verified_profile")) },
  { label: "ats", cell: (p) => check(levelOf(p, "hire.pipeline.level") === "advanced") },
  {
    label: "search.text",
    cell: (p) => {
      if (isContract(p, "hire.talent_search.monthly")) return text("search.contract");
      const values = { quota: limitOf(p, "hire.talent_search.monthly") ?? 0 };
      return levelOf(p, "hire.talent_search") === "deep"
        ? text("search.advanced", values)
        : text("search.standard", values);
    },
  },
  {
    label: "contacts.text",
    cell: (p) => quota(p, "hire.contact_requests.monthly", "contacts.monthly", "contacts.contract"),
  },
  {
    label: "interviews.text",
    cell: (p) => text(isEnabled(p, "org.teams") ? "interviews.team" : "interviews.organize"),
  },
  {
    label: "scorecards",
    cell: (p) => check(isEnabled(p, "hire.scorecards") && isEnabled(p, "hire.decision_history")),
  },
  {
    label: "teams.text",
    cell: (p) =>
      isEnabled(p, "org.entities")
        ? text("teams.entities")
        : isEnabled(p, "org.teams")
          ? text("teams.multi")
          : { kind: "dash" },
  },
  {
    label: "permissions.text",
    cell: (p) => text(`permissions.${levelOf(p, "org.permissions.level")}`),
  },
  { label: "pools", cell: (p) => check(isEnabled(p, "org.talent_pools.shared")) },
  {
    label: "dashboards.text",
    cell: (p) => text(`dashboards.${companyDashboards[levelOf(p, "reports.level")] ?? "shared"}`),
  },
  {
    label: "reports.text",
    cell: (p) => text(`reports.${companyReports[levelOf(p, "reports.level")] ?? "stats"}`),
  },
  {
    label: "workflows",
    cell: (p) => check(isEnabled(p, "hire.workflows.custom") && isEnabled(p, "integrations")),
  },
  // Configuration support comes with configurable workflows (Company Premium, partie 05 § 2.3).
  { label: "onboarding", cell: (p) => check(isEnabled(p, "hire.workflows.custom")) },
  { label: "ai.text", cell: (p) => quota(p, "ai.credits.monthly", "ai.monthly", "ai.contract") },
  {
    label: "support.text",
    cell: (p) =>
      isContract(p, "org.seats")
        ? text("support.contract")
        : text(isEnabled(p, "support.priority") ? "support.priority" : "support.standard"),
  },
];

export const compareRows: Partial<Record<PlanFamily, CompareRow[]>> = { talent, rh, company };
