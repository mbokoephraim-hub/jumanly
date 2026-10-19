import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import {
  addStepAction,
  deleteStepAction,
  planFromDiagnosticAction,
  saveGoalAction,
  toggleStepAction,
  updateStepAction,
} from "@/server/actions/progress-plan";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { recommendedCourses } from "@/server/matching/service";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";
import { cheapestPlanWhere, isEnabled, listPublicPlans } from "@/server/services/plans";
import { currentStepId, getPlan, stepState, type PlanStep } from "@/server/services/progress-plan";
import { REPORT_KEY } from "@/server/services/progress-report";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("plan");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * « Mon plan de progression » (planche talent-4 § 5, `career.progress_plan`): the goal with its
 * progress, then the steps done, in progress and to do. Orbi proposes the steps from the last
 * diagnostic; every step opens a sheet to change it, tick it off or remove it.
 */
export default async function ProgressPlanPage({ searchParams }: PageProps<"/app/career/plan">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/plan");
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const subject = { type: "user" as const, id: user.id };
  const [allowed, withRecommendations, detailed] = await Promise.all([
    can(db, subject, "career.progress_plan"),
    can(db, subject, "career.progress_plan.recommendations"),
    can(db, subject, REPORT_KEY),
  ]);
  const head = (
    <FlowHead back="/app/career/diagnostic" backLabel={t("plan.back")} title={t("plan.title")} />
  );

  if (!allowed) {
    const plan =
      cheapestPlanWhere(await listPublicPlans(db), ["talent"], (item) =>
        isEnabled(item, "career.progress_plan"),
      )?.name ?? "";
    return (
      <div className="t-flux">
        {head}
        <div className="t-verrou">
          <TalentIcon name="cadenas" size="s" />
          <div className="t-t">
            <b>{t("plan.locked.title")}</b>
            {t("plan.locked.text", { plan })}
          </div>
        </div>
        <div className="t-verre t-fort t-bas-f">
          <Link href="/app/abonnement" className="t-bt t-p t-pl t-press">
            {t("plan.locked.cta")}
          </Link>
        </div>
      </div>
    );
  }

  const plan = await getPlan(db, user.id);
  const catalog = withRecommendations ? await catalogLevelOf(db, user.id) : "";
  const courses = withRecommendations
    ? await recommendedCourses(db, user.id, {
        opens: (required) => opensCourse(catalog, required),
        take: 3,
      })
    : [];
  const steps = plan?.steps ?? [];
  const done = steps.filter((step) => step.done).length;
  const current = currentStepId(steps);
  const titleOf = (step: PlanStep) =>
    step.title ||
    (step.code ? d(`career.diagnostic.rule.step.${step.code}`) : t("plan.kind.custom"));
  const dateOf = (due: string) =>
    format.dateTime(new Date(`${due}T12:00:00Z`), { day: "numeric", month: "short" });
  const lineOf = (step: PlanStep) => {
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

  return (
    <div className="t-flux">
      {head}
      {query.ok && <Notice tone="ok">{t("plan.saved")}</Notice>}
      {query.erreur && <Notice tone="err">{t("plan.error")}</Notice>}

      <SheetButton target="pl-objectif" className="t-parc-h t-press">
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
      </SheetButton>
      <Sheet id="pl-objectif" title={t("plan.goal.edit")} closeLabel={t("plan.close")}>
        <form action={saveGoalAction}>
          <div className="t-champ">
            <label htmlFor="pl-goal">{t("plan.goal.label")}</label>
            <input
              id="pl-goal"
              name="goal"
              type="text"
              className="t-saisie-d"
              maxLength={160}
              defaultValue={plan?.goal ?? ""}
              placeholder={t("plan.goal.placeholder")}
            />
          </div>
          <button type="submit" className="t-bt t-p t-pl t-press">
            {t("plan.step.save")}
          </button>
        </form>
      </Sheet>

      {steps.length === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{t("plan.empty.title")}</b>
          <p>{t("plan.empty.text")}</p>
          <form action={planFromDiagnosticAction}>
            <button type="submit" className="t-bt t-p t-s t-press">
              {t("plan.empty.fromDiagnostic")}
            </button>
          </form>
          <Link href="/app/career/diagnostic" className="t-lien-d">
            {t("plan.empty.diagnostic")}
          </Link>
        </div>
      ) : (
        <ol className="t-etapes-p" aria-label={t("plan.steps")}>
          {steps.map((step, index) => {
            const state = stepState(step);
            const title = titleOf(step);
            return (
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
                <SheetButton target={`pl-e-${step.id}`} className="t-verre t-press">
                  <b>{title}</b>
                  <span>{lineOf(step)}</span>
                </SheetButton>
                <Sheet id={`pl-e-${step.id}`} title={title} closeLabel={t("plan.close")}>
                  <form action={updateStepAction}>
                    <input type="hidden" name="step" value={step.id} />
                    <div className="t-champ">
                      <label htmlFor={`pl-t-${step.id}`}>{t("plan.step.title")}</label>
                      <input
                        id={`pl-t-${step.id}`}
                        name="title"
                        type="text"
                        className="t-saisie-d"
                        required
                        maxLength={160}
                        defaultValue={title}
                      />
                    </div>
                    <div className="t-champ">
                      <label htmlFor={`pl-d-${step.id}`}>{t("plan.step.due")}</label>
                      <input
                        id={`pl-d-${step.id}`}
                        name="due"
                        type="date"
                        className="t-saisie-d"
                        defaultValue={step.due ?? ""}
                      />
                    </div>
                    <button type="submit" className="t-bt t-p t-pl t-press">
                      {t("plan.step.save")}
                    </button>
                  </form>
                  <div className="t-plan-acts">
                    {step.href && (
                      <Link href={step.href} className="t-bt t-sec t-press">
                        {t("plan.step.open")}
                      </Link>
                    )}
                    <form action={toggleStepAction}>
                      <input type="hidden" name="step" value={step.id} />
                      <button type="submit" className="t-bt t-sec t-press">
                        {state === "done" ? t("plan.step.markTodo") : t("plan.step.markDone")}
                      </button>
                    </form>
                    <form action={deleteStepAction}>
                      <input type="hidden" name="step" value={step.id} />
                      <button type="submit" className="t-bt t-dg t-press">
                        {t("plan.step.remove")}
                      </button>
                    </form>
                  </div>
                </Sheet>
              </li>
            );
          })}
        </ol>
      )}

      <SheetButton target="pl-ajout" className="t-ajout t-press">
        <TalentIcon name="plus" size="s" />
        {t("plan.add")}
      </SheetButton>
      <Sheet id="pl-ajout" title={t("plan.addTitle")} closeLabel={t("plan.close")}>
        <form action={addStepAction}>
          <div className="t-champ">
            <label htmlFor="pl-nouvelle">{t("plan.step.title")}</label>
            <input
              id="pl-nouvelle"
              name="title"
              type="text"
              className="t-saisie-d"
              required
              maxLength={160}
            />
          </div>
          <div className="t-champ">
            <label htmlFor="pl-nouvelle-d">{t("plan.step.due")}</label>
            <input id="pl-nouvelle-d" name="due" type="date" className="t-saisie-d" />
          </div>
          <button type="submit" className="t-bt t-p t-pl t-press">
            {t("plan.add")}
          </button>
        </form>
      </Sheet>

      <p className="t-gar">
        <TalentIcon name="pourquoi" size="s" />
        <span>{t("plan.note")}</span>
      </p>

      {courses.length > 0 && (
        <section aria-labelledby="pl-formations" className="t-flux t-serre">
          <h2 id="pl-formations" className="t-ck-t">
            {t("plan.courses")}
          </h2>
          <div className="t-verre t-liste t-lignes">
            {courses.map((course) => (
              <Link key={course.slug} href={`/app/learn/${course.slug}`} className="t-li t-press">
                <span className="t-cases t-c1">
                  <TalentIcon name="former" size="s" />
                </span>
                <span className="t-t">
                  <b>{course.title}</b>
                  <span>{t("ai.recoCourses.reason.demand", { percent: course.percent })}</span>
                </span>
                <TalentIcon name="suivant" size="s" />
              </Link>
            ))}
          </div>
          <div className="t-bulle-o">
            <OrbiMark size={32} />
            <div className="t-verre t-corps">
              <span>{t("plan.coursesWhy")}</span>
            </div>
          </div>
        </section>
      )}

      {detailed && (
        <a href="/app/career/plan/rapport" className="t-verre t-pj t-press" download>
          <span className="t-cases">
            <TalentIcon name="telecharger" size="s" />
          </span>
          <span className="t-t">
            <b>{t("plan.report")}</b>
            <span>{t("plan.reportText")}</span>
          </span>
          <TalentIcon name="suivant" size="s" />
        </a>
      )}
    </div>
  );
}
