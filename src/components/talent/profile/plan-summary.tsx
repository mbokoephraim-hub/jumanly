import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { cheapestPlanWhere, isEnabled, listPublicPlans } from "@/server/services/plans";
import { currentStepId, getPlan, stepState, type PlanStep } from "@/server/services/progress-plan";

/** The title and the line of a step of the plan (« Formation · 30 min · en cours »). */
export async function planStepLabels() {
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const titleOf = (step: PlanStep) =>
    step.title ||
    (step.code ? d(`career.diagnostic.rule.step.${step.code}`) : t("plan.kind.custom"));
  const dateOf = (due: string) =>
    format.dateTime(new Date(`${due}T12:00:00Z`), { day: "numeric", month: "short" });
  const lineOf = (step: PlanStep, current: string | null) => {
    const state = stepState(step);
    return [
      t(`plan.kind.${step.kind}`),
      step.due && state !== "done" ? t("plan.due", { date: dateOf(step.due) }) : null,
      state === "done"
        ? t("plan.state.done")
        : state === "late"
          ? t("plan.state.late")
          : step.id === current
            ? t("plan.state.current")
            : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };
  return { titleOf, lineOf };
}

/**
 * « Mon plan de progression » beside the diagnostic on a tablet or a computer (planche web
 * talent-4 § 5): the goal with its progress, then the steps, each one opening the plan where it
 * changes. Without `career.progress_plan`, the way to the plans.
 */
export async function PlanSummary({ userId }: { userId: string }) {
  const t = await getTranslations();
  const subject = { type: "user" as const, id: userId };
  if (!(await can(db, subject, "career.progress_plan"))) {
    const plan =
      cheapestPlanWhere(await listPublicPlans(db), ["talent"], (item) =>
        isEnabled(item, "career.progress_plan"),
      )?.name ?? "";
    return (
      <Link href="/app/abonnement/formules" className="t-verrou t-press">
        <TalentIcon name="cadenas" size="s" />
        <span className="t-t">
          <b>{t("plan.locked.title")}</b>
          {t("plan.locked.text", { plan })}
        </span>
      </Link>
    );
  }
  const plan = await getPlan(db, userId);
  const steps = plan?.steps ?? [];
  const done = steps.filter((step) => step.done).length;
  const current = currentStepId(steps);
  const { titleOf, lineOf } = await planStepLabels();
  return (
    <>
      <Link href="/app/career/plan" className="t-parc-h t-press">
        <span className="t-k">{t("plan.goal.kicker")}</span>
        <span className="t-h2">{plan?.goal || t("plan.goal.empty")}</span>
        {steps.length > 0 && (
          <>
            <span className="t-barre" aria-hidden>
              <i style={{ width: `${Math.round((100 * done) / steps.length)}%` }} />
            </span>
            <span className="t-v">{t("plan.progress", { done, total: steps.length })}</span>
          </>
        )}
      </Link>
      {steps.length === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{t("plan.empty.title")}</b>
          <p>{t("plan.empty.text")}</p>
          <Link href="/app/career/plan" className="t-bt t-p t-s t-press">
            {t("plan.empty.fromDiagnostic")}
          </Link>
        </div>
      ) : (
        <ol className="t-etapes-p" aria-label={t("plan.steps")}>
          {steps.map((step, index) => (
            <li key={step.id} className={cx("t-e", step.done && "t-fait")}>
              <span
                className={cx(
                  "t-num",
                  step.done ? "t-ok" : step.id === current ? "t-en" : undefined,
                )}
                aria-hidden
              >
                {step.done ? <TalentIcon name="valider" size="xs" /> : index + 1}
              </span>
              <Link href="/app/career/plan" className="t-verre t-press">
                <b>{titleOf(step)}</b>
                <span>{lineOf(step, current)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="t-gar">
        <TalentIcon name="pourquoi" size="s" />
        <span>{t("plan.note")}</span>
      </p>
    </>
  );
}
