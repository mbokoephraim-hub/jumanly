import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import {
  card,
  cardTitle,
  CareerTabs,
  eyebrow,
  IconTile,
  pillClass,
  ScoreRing,
  Why,
} from "@/components/career/kit";
import { Pattern } from "@/components/site/marketing";
import { Alert, PlanLock, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
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
      <>
        <AppPageHeader eyebrow={t("career.plan.subtitle")} title={t("career.plan.title")} />
        <CareerTabs active="plan" />
        <PlanLock
          plan={planFor("career.progress_plan")}
          description={t("career.plan.locked", { plan: planFor("career.progress_plan") })}
        />
      </>
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
  const progress = t("career.plan.progress", { done: doneCount, total: steps.length });

  return (
    <>
      <AppPageHeader eyebrow={t("career.plan.subtitle")} title={t("career.plan.title")} />
      <CareerTabs active="plan" />
      {query.ok && <Alert tone="success" title={t("career.plan.saved")} />}
      {query.erreur && <Alert tone="error" title={t("talent.profile.error")} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section
            aria-labelledby="plan-goal-title"
            className="relative grid gap-5 overflow-hidden rounded-[28px] bg-sapin p-6 text-blanc sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:p-[30px]"
          >
            <Pattern
              name="motif-trajectoires-sombre"
              size={260}
              opacity={0.45}
              className="[mask-image:linear-gradient(90deg,transparent_35%,#000)]"
            />
            <div className="relative flex flex-col gap-2">
              <p className={cx(eyebrow, "text-neon")}>{t("career.plan.goal.text")}</p>
              <h2
                id="plan-goal-title"
                className="text-[24px] leading-[1.15] font-bold tracking-tight lg:text-[30px]"
              >
                {plan?.goal || t("career.plan.goal.add")}
              </h2>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-blanc/85">
                {plan && (
                  <span className="flex items-center gap-1.5">
                    <Icon name="calendrier" className="size-4 text-lime" />
                    {t("career.plan.updated", { date: plan.updatedAt })}
                  </span>
                )}
                <Link
                  href="/app/career/diagnostic"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Icon name="objectif" className="size-4 text-lime" />
                  {t("career.diagnostic.title")}
                </Link>
              </p>
            </div>
            {steps.length > 0 && (
              <div className="relative flex items-center gap-4">
                <ScoreRing
                  value={doneCount}
                  max={steps.length}
                  label={t("career.home.stats.ratio", { value: doneCount, max: steps.length })}
                  size={92}
                  dark
                />
                <div className="flex max-w-[220px] flex-col gap-1">
                  <p className="text-[15px] font-semibold">{progress}</p>
                  <p className="text-xs leading-[17px] text-blanc/80">
                    {t("career.plan.encouragement", { done: doneCount })}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section
            aria-labelledby="plan-steps"
            className={cx(card, "flex flex-col gap-4 lg:p-[26px]")}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="plan-steps" className={cardTitle}>
                {t("career.plan.steps")}
              </h2>
              <a href="#ajouter" className={pillClass("outline", "sm")}>
                <Icon name="plus" className="size-4" />
                {t("career.plan.step.add")}
              </a>
            </div>
            {steps.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-[18px] bg-creme p-5">
                <p className="text-sm">{t("career.plan.empty")}</p>
                <form action={planFromDiagnosticAction}>
                  <button type="submit" className={pillClass("dark", "sm")}>
                    {t("career.plan.fromDiagnostic")}
                  </button>
                </form>
              </div>
            ) : (
              <ol className="flex flex-col divide-y divide-brume">
                {steps.map((step) => {
                  const state = stepState(step);
                  const title =
                    step.kind === "diagnostic" && step.code
                      ? t(`career.diagnostic.rule.step.${step.code}`)
                      : step.title;
                  return (
                    <li key={step.id} className="flex items-start gap-3 py-3">
                      <form action={toggleStepAction}>
                        <input type="hidden" name="step" value={step.id} />
                        <button
                          type="submit"
                          aria-label={[
                            step.done ? t("career.plan.step.todo") : t("career.plan.step.done"),
                            title,
                          ].join(" · ")}
                          className={cx(
                            "flex size-8 shrink-0 items-center justify-center rounded-full",
                            state === "done"
                              ? "bg-lime text-sapin"
                              : state === "late"
                                ? "bg-down-fond text-down-texte ring-1 ring-corail ring-inset hover:bg-lime-clair"
                                : "bg-blanc ring-[1.5px] ring-brume ring-inset hover:bg-lime-clair",
                          )}
                        >
                          {state === "done" ? (
                            <Icon name="check" className="size-4" />
                          ) : state === "late" ? (
                            <Icon name="horloge" className="size-4" />
                          ) : null}
                        </button>
                      </form>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
                        <span
                          className={cx(
                            "text-[15px] leading-5",
                            state === "done" ? "text-ardoise" : "font-semibold",
                          )}
                        >
                          {step.href ? (
                            <Link href={step.href} className="hover:underline">
                              {title}
                            </Link>
                          ) : (
                            title
                          )}
                        </span>
                        {step.due && (
                          <span className="text-xs text-ardoise">
                            {t("career.plan.step.due", {
                              date: new Date(`${step.due}T12:00:00Z`),
                            })}
                          </span>
                        )}
                      </div>
                      <span
                        className={cx(
                          "mt-1 shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                          stateTone[state],
                        )}
                      >
                        {t(`career.plan.step.${state}`)}
                      </span>
                      <form action={deleteStepAction}>
                        <input type="hidden" name="step" value={step.id} />
                        <button
                          type="submit"
                          aria-label={[t("talent.profile.delete"), title].join(" · ")}
                          title={t("talent.profile.delete")}
                          className="flex size-8 items-center justify-center rounded-full text-ardoise hover:bg-creme hover:text-sapin"
                        >
                          <Icon name="fermer" className="size-4" />
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ol>
            )}
            <form
              id="ajouter"
              action={addStepAction}
              className="grid scroll-mt-24 gap-3 rounded-[18px] bg-creme p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end"
            >
              <TextField
                id="plan-step-title"
                name="title"
                label={t("career.plan.step.add")}
                placeholder={t("career.plan.step.title.placeholder")}
                maxLength={160}
                required
              />
              <TextField
                id="plan-step-due"
                name="due"
                type="date"
                label={t("career.plan.deadline")}
              />
              <button type="submit" className={pillClass("dark", "sm", "h-11")}>
                {t("talent.profile.add")}
              </button>
            </form>
          </section>

          <form
            action={saveGoalAction}
            className={cx(card, "flex flex-wrap items-end gap-4 lg:px-[26px] lg:py-5")}
          >
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-lime"
            >
              <Icon name="objectif" className="size-5" />
            </span>
            <div className="min-w-[220px] flex-1">
              <TextField
                id="plan-goal"
                name="goal"
                label={plan?.goal ? t("career.plan.goal.text") : t("career.plan.goal.add")}
                placeholder={t("career.plan.goal.placeholder")}
                defaultValue={plan?.goal ?? ""}
                maxLength={160}
              />
            </div>
            <button type="submit" className={pillClass("dark", "sm", "h-11")}>
              {plan?.goal ? t("talent.profile.save") : t("career.plan.goal.add")}
            </button>
          </form>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section aria-labelledby="plan-courses" className={cx(card, "flex flex-col gap-3")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 id="plan-courses" className={cardTitle}>
                {t("career.plan.courses")}
              </h2>
              <AiOrb size={22} />
            </div>
            {!withRecommendations ? (
              <PlanLock
                plan={planFor("career.progress_plan.recommendations")}
                description={t("career.plan.recommendations.locked", {
                  plan: planFor("career.progress_plan.recommendations"),
                })}
              />
            ) : courses.length === 0 ? (
              <p className="text-sm text-ardoise">{t("match.why.talent.courses.none")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-brume">
                {courses.map((course) => (
                  <li key={course.slug} className="flex items-start gap-3 py-3">
                    <IconTile icon="learn" size="sm" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <Link
                        href={`/app/learn/${course.slug}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {course.title}
                      </Link>
                      <span className="text-xs text-ardoise">
                        {[
                          t("ai.recoCourses.reason.demand", { percent: course.percent }),
                          course.open
                            ? t("match.why.talent.courses.included")
                            : t("learn.error.locked"),
                        ].join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Why>{t("ai.recoCourses.why")}</Why>
          </section>

          <section aria-labelledby="plan-report" className={cx(card, "flex flex-col gap-3")}>
            <div className="flex items-start justify-between gap-2">
              <h2 id="plan-report" className={cardTitle}>
                {t("career.plan.report.text")}
              </h2>
              <Icon name="statistiques" className="mt-1 size-5 shrink-0" />
            </div>
            {detailed ? (
              <>
                <p className="text-sm text-ardoise">{t("career.plan.report.desc")}</p>
                <a
                  href="/app/career/plan/rapport"
                  className={pillClass("dark", "sm", "self-start")}
                >
                  <Icon name="telecharger" className="size-4" />
                  {t("career.plan.report.download")}
                </a>
              </>
            ) : (
              <PlanLock
                plan={planFor(REPORT_KEY)}
                description={t("career.plan.report.locked", { plan: planFor(REPORT_KEY) })}
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}

const stateTone = {
  done: "bg-lime-clair text-sapin",
  late: "bg-down-fond text-down-texte",
  todo: "bg-gris-clair text-sapin",
} as const;
