import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, ButtonLink, ProgressBar, TextField } from "@/components/ui";
import {
  addStepAction,
  deleteStepAction,
  planFromDiagnosticAction,
  saveGoalAction,
  toggleStepAction,
} from "@/server/actions/progress-plan";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { recommendedCourses } from "@/server/matching/service";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";
import { cheapestPlanWhere, isEnabled, listPublicPlans } from "@/server/services/plans";
import { getPlan, stepState } from "@/server/services/progress-plan";
import { REPORT_KEY } from "@/server/services/progress-report";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.plan");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Progress plan (partie 07 § 4, `career.progress_plan`): goal and steps the talent ticks off,
 * created from the diagnostic or by hand. With `career.progress_plan.recommendations`, the
 * courses that close the most frequent gaps of the talent's best jobs (§ 8.7).
 */
export default async function ProgressPlanPage({ searchParams }: PageProps<"/app/career/plan">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/plan");
  const t = await getTranslations();
  const subject = { type: "user" as const, id: user.id };
  const [allowed, withRecommendations, detailed, plans] = await Promise.all([
    can(db, subject, "career.progress_plan"),
    can(db, subject, "career.progress_plan.recommendations"),
    can(db, subject, REPORT_KEY),
    listPublicPlans(db),
  ]);
  const planFor = (key: string) =>
    cheapestPlanWhere(plans, ["talent"], (plan) => isEnabled(plan, key))?.name ?? "";

  if (!allowed) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-h1">{t("career.plan.title")}</h1>
        <p className="text-ardoise">{t("career.plan.subtitle")}</p>
        <Alert title={t("career.plan.locked", { plan: planFor("career.progress_plan") })} />
      </div>
    );
  }

  const plan = await getPlan(db, user.id);
  const catalog = await catalogLevelOf(db, user.id);
  const courses = withRecommendations
    ? await recommendedCourses(db, user.id, {
        opens: (required) => opensCourse(catalog, required),
        take: 3,
      })
    : [];
  const steps = plan?.steps ?? [];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career" className="text-sm underline">
        {t("career.home.eyebrow")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("career.plan.title")}</h1>
        <p className="text-ardoise">{t("career.plan.subtitle")}</p>
      </header>
      {query.ok && <Alert tone="success" title={t("career.plan.saved")} />}
      {query.erreur && <Alert tone="error" title={t("talent.profile.error")} />}

      {!plan || steps.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-card bg-blanc p-6">
          <p>{t("career.plan.empty")}</p>
          <form action={planFromDiagnosticAction}>
            <Button type="submit">{t("career.plan.fromDiagnostic")}</Button>
          </form>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
          <p className="font-semibold">
            {t("career.plan.progress", { done: doneCount, total: steps.length })}
          </p>
          <ProgressBar
            value={Math.round((100 * doneCount) / steps.length)}
            label={t("career.plan.progress", { done: doneCount, total: steps.length })}
          />
          <p className="text-sm text-ardoise">
            {t("career.plan.encouragement", { done: doneCount })}
          </p>
        </section>
      )}

      <form action={saveGoalAction} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <TextField
          id="plan-goal"
          name="goal"
          label={t("career.plan.goal.text")}
          placeholder={t("career.plan.goal.placeholder")}
          defaultValue={plan?.goal ?? ""}
          maxLength={160}
        />
        <div>
          <Button type="submit" variant="secondary" size="sm">
            {t("talent.profile.save")}
          </Button>
        </div>
      </form>

      {steps.length > 0 && (
        <ol className="flex flex-col gap-3">
          {steps.map((step) => {
            const state = stepState(step);
            const title =
              step.kind === "diagnostic" && step.code
                ? t(`career.diagnostic.rule.step.${step.code}`)
                : step.title;
            return (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-blanc p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className={state === "done" ? "line-through" : "font-medium"}>
                    {step.href ? (
                      <Link href={step.href} className="underline">
                        {title}
                      </Link>
                    ) : (
                      title
                    )}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-ardoise">
                    <Badge
                      tone={state === "done" ? "success" : state === "late" ? "warning" : "neutral"}
                    >
                      {t(`career.plan.step.${state}`)}
                    </Badge>
                    {step.due &&
                      t("career.plan.step.due", { date: new Date(`${step.due}T12:00:00Z`) })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <form action={toggleStepAction}>
                    <input type="hidden" name="step" value={step.id} />
                    <Button type="submit" size="sm" variant={step.done ? "tertiary" : "secondary"}>
                      {step.done ? t("career.plan.step.todo") : t("career.plan.step.done")}
                    </Button>
                  </form>
                  <form action={deleteStepAction}>
                    <input type="hidden" name="step" value={step.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="tertiary"
                      aria-label={[t("talent.profile.delete"), title].join(" · ")}
                    >
                      {t("talent.profile.delete")}
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <form action={addStepAction} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="font-semibold text-h3">{t("career.plan.step.add")}</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <TextField
            id="plan-step-title"
            name="title"
            label={t("career.plan.step.add")}
            placeholder={t("career.plan.step.title.placeholder")}
            maxLength={160}
            required
          />
          <TextField id="plan-step-due" name="due" type="date" label={t("career.plan.deadline")} />
        </div>
        <div>
          <Button type="submit" variant="secondary" size="sm">
            {t("talent.profile.add")}
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="text-h2">{t("career.plan.recommendations.text")}</h2>
        {!withRecommendations ? (
          <p className="text-sm text-ardoise">
            {t("career.plan.recommendations.locked", {
              plan: planFor("career.progress_plan.recommendations"),
            })}
          </p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-ardoise">{t("match.why.talent.courses.none")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {courses.map((course) => (
              <li key={course.slug} className="flex flex-col gap-1">
                <Link href={`/app/learn/${course.slug}`} className="font-medium underline">
                  {course.title}
                </Link>
                <span className="text-sm text-ardoise">
                  {[
                    t("ai.recoCourses.reason.demand", { percent: course.percent }),
                    course.open ? t("match.why.talent.courses.included") : t("learn.error.locked"),
                  ].join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-ardoise">{t("ai.recoCourses.why")}</p>
      </section>
      <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="text-h2">{t("career.plan.report.text")}</h2>
        {detailed ? (
          <>
            <p className="text-sm">{t("career.plan.report.desc")}</p>
            <ButtonLink
              href="/app/career/plan/rapport"
              prefetch={false}
              variant="secondary"
              size="sm"
              className="self-start"
            >
              {t("career.plan.report.download")}
            </ButtonLink>
          </>
        ) : (
          <p className="text-sm text-ardoise">
            {t("career.plan.report.locked", { plan: planFor(REPORT_KEY) })}
          </p>
        )}
      </section>
      <p className="text-sm text-ardoise">
        {plan ? t("career.diagnostic.result.date", { date: plan.updatedAt }) : null}
      </p>
      <ButtonLink href="/app/career/diagnostic" variant="tertiary" className="self-start">
        {t("career.diagnostic.title")}
      </ButtonLink>
    </div>
  );
}
