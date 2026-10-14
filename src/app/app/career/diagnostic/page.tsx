import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import {
  AiBrand,
  AiPanel,
  card,
  cardTitle,
  CareerTabs,
  IconTile,
  pillClass,
} from "@/components/career/kit";
import { Alert, Checkbox, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { dynamic } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { aiReadiness } from "@/server/ai";
import { submitDiagnostic } from "@/server/actions/diagnostic";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import {
  choiceQuestions,
  DIAGNOSTIC_QUESTIONS,
  DIAGNOSTIC_QUESTIONS_PERSONALIZED,
  diagnosticParts,
  educationAnswers,
  parseDiagnosticResult,
  parsePersonalized,
  stepLinks,
  valueAnswers,
  workStyleAnswers,
} from "@/server/services/diagnostic";
import { DIAGNOSTIC_GATE } from "@/server/services/diagnostic-ai";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.diagnostic");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

type ChoiceQuestion = keyof typeof choiceQuestions;

/**
 * Career diagnostic (partie 07 § 4): the questions on one page (works without JavaScript and
 * on a slow network). Simplified: fixed rules, no AI (E3). Personalized (E6, from
 * `career.diagnostic.level`): eight more questions and a summary by Jumanly Intelligence.
 */
export default async function DiagnosticPage({
  searchParams,
}: PageProps<"/app/career/diagnostic">) {
  const params = await searchParams;
  const user = await requireUser("/app/career/diagnostic");
  const t = await getTranslations("career.diagnostic");
  const history = await db.careerDiagnostic.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, createdAt: true, result: true, level: true },
  });
  const wanted = typeof params.bilan === "string" ? params.bilan : undefined;
  const current = wanted ? history.find((item) => item.id === wanted) : undefined;
  const result = current ? parseDiagnosticResult(current.result) : null;
  const personal = current?.level === "personalized" ? parsePersonalized(current.result) : null;
  const tAi = await getTranslations("ai");

  if (current && result) {
    const levels = ["low", "medium", "high"] as const;
    const reached = levels.indexOf(result.readiness);
    const roleIcons: IconName[] = ["statistiques", "competence", "portefeuille"];
    const strengths =
      personal && personal.strengthTexts.length > 0
        ? personal.strengthTexts
        : result.strengths.length === 0
          ? [t("rule.strength.none")]
          : result.strengths.map((key) => t(`rule.strength.${key}`));
    return (
      <>
        <AppPageHeader eyebrow={t("eyebrow")} title={t("result.title")} />
        <CareerTabs active="diagnostic" />
        <p className="flex flex-wrap items-center gap-3 text-[13px] text-ardoise">
          <span
            className={cx(
              "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold",
              personal ? "bg-sapin text-neon" : "bg-gris-clair text-sapin",
            )}
          >
            <Icon name="intelligence" className="size-3.5" />
            {personal ? t("badge.personalized") : t("badge.simple")}
          </span>
          {[
            t("result.date", { date: current.createdAt }),
            t("result.questions", {
              count: personal ? DIAGNOSTIC_QUESTIONS_PERSONALIZED : DIAGNOSTIC_QUESTIONS,
            }),
          ].join(" · ")}
        </p>
        {params.ia === "unavailable" && <Alert tone="error" title={tAi("card.error")} />}
        {params.ia === "quota" && <Alert tone="warning" title={tAi("credits.reached.title")} />}
        {params.ia === "consent" && <Alert title={tAi("consent.declined.state")} />}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <section aria-labelledby="readiness" className={cx(card, "flex flex-col gap-4")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="readiness" className={cardTitle}>
                  {t("result.readiness.text")}
                </h2>
                <span className="rounded-pill bg-lime-clair px-2.5 py-1 text-xs font-semibold">
                  {t(`result.readiness.${result.readiness}`)}
                </span>
              </div>
              <ol className="grid grid-cols-3 gap-2">
                {levels.map((code, index) => (
                  <li key={code} className="flex flex-col gap-2">
                    <span
                      aria-hidden
                      className={cx(
                        "h-2 rounded-pill",
                        index < reached
                          ? "bg-lime"
                          : index === reached
                            ? "bg-feuille"
                            : "bg-gris-clair",
                      )}
                    />
                    <span
                      aria-current={index === reached ? "step" : undefined}
                      className={cx(
                        "text-xs",
                        index === reached ? "font-semibold" : "text-ardoise",
                      )}
                    >
                      {t(`result.readiness.${code}`)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <section aria-labelledby="strengths" className={cx(card, "flex flex-col gap-4")}>
                <h2 id="strengths" className={cardTitle}>
                  {t("result.strengths")}
                </h2>
                {result.skills.length > 0 && (
                  <p className="text-sm">
                    {t("result.namedSkills", { skills: result.skills.join(", ") })}
                  </p>
                )}
                <ul className="flex flex-col gap-3">
                  {strengths.map((text) => (
                    <li key={text} className="flex gap-3 text-[15px] leading-6">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-clair text-feuille">
                        <Icon name="check" className="size-3" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="priorities" className={cx(card, "flex flex-col gap-4")}>
                <h2 id="priorities" className={cardTitle}>
                  {t("result.priorities")}
                </h2>
                <ol className="flex flex-col gap-3">
                  {result.priorities.map((key) => (
                    <li key={key} className="flex gap-3 text-[15px] leading-6 font-semibold">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-lime text-sapin">
                        <Icon name="objectif" className="size-3.5" />
                      </span>
                      {t(`rule.priority.${key}`)}
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section aria-labelledby="roles" className={cx(card, "flex flex-col gap-4")}>
              <h2 id="roles" className={cardTitle}>
                {t("result.roles")}
              </h2>
              {result.roles.length === 0 ? (
                <p className="text-sm text-ardoise">{t("result.rolesEmpty")}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {result.roles.map((role, index) => (
                    <li key={role} className="flex flex-col gap-2 rounded-[18px] bg-creme p-4">
                      <IconTile
                        icon={roleIcons[index % roleIcons.length]!}
                        tone="bg-blanc"
                        size="sm"
                      />
                      <p className="mt-1 text-[15px] font-semibold">{role}</p>
                      <Link
                        href={`/app/jobs?q=${encodeURIComponent(role)}`}
                        className="flex items-center gap-1 text-[13px] font-semibold text-up-texte hover:underline"
                      >
                        {t("result.exploreJobs")}
                        <Icon name="chev-r" className="size-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="next-steps" className={cx(card, "flex flex-col gap-4")}>
              <h2 id="next-steps" className={cardTitle}>
                {t("result.nextSteps")}
              </h2>
              <ol className="flex flex-col gap-3">
                {result.steps.map((step, index) => (
                  <li key={step} className="flex flex-wrap items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sapin text-sm font-semibold text-lime">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px]">{t(`rule.step.${step}`)}</span>
                    <Link
                      href={stepLinks[step]}
                      className="text-[13px] font-semibold text-up-texte hover:underline"
                    >
                      {t("rule.step.cta")}
                    </Link>
                  </li>
                ))}
              </ol>
              <Link href="/app/career/plan" className={pillClass("dark", "md", "mt-2 self-start")}>
                {t("result.createPlan")}
                <Icon name="chev-r" className="size-4" />
              </Link>
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <AiPanel>
              <AiBrand />
              {personal && personal.summary && (
                <p className="text-sm leading-6 whitespace-pre-line">{personal.summary}</p>
              )}
              <p className="text-[13px] leading-5 text-blanc/85">
                {personal ? t("result.personalized.note") : t("result.simple.note")}
              </p>
            </AiPanel>
            <section className={cx(card, "flex flex-col gap-3")}>
              <Link href="/app/career/diagnostic#questions" className={pillClass("outline")}>
                {t("restart")}
              </Link>
            </section>
            <History history={history} currentId={current.id} />
            <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
              <Icon name="lock" className="mt-px size-4 shrink-0" />
              {t("privacy")}
            </p>
          </aside>
        </div>
      </>
    );
  }

  const tProfile = await getTranslations("talent.profile.education.level");
  const choice = (id: ChoiceQuestion) => (
    <Choices
      legend={t(`q.${id}.text`)}
      name={id}
      required
      options={choiceQuestions[id].map((code) => ({
        value: code,
        label: dynamic(t)(`q.${id}.${code}`),
      }))}
    />
  );
  const questions: Record<string, ReactNode> = {
    situation: choice("situation"),
    experience: choice("experience"),
    education: (
      <Choices
        legend={t("q.education")}
        name="education"
        required
        options={educationAnswers.map((code) => ({ value: code, label: tProfile(code) }))}
      />
    ),
    goal: choice("goal"),
    targetRole: (
      <TextField
        id="targetRole"
        name="targetRole"
        label={t("q.targetRole.text")}
        placeholder={t("q.targetRole.placeholder")}
        hint={t("q.targetRole.hint")}
        maxLength={120}
      />
    ),
    topSkills: (
      <TextField
        id="topSkills"
        name="topSkills"
        label={t("q.topSkills")}
        placeholder={t("q.topSkillsPlaceholder")}
        hint={t("q.topSkillsHint")}
        maxLength={200}
      />
    ),
    confidence: (
      <Choices
        legend={t("q.confidence.text")}
        name="confidence"
        required
        options={[1, 2, 3, 4, 5].map((value) => ({
          value: String(value),
          label:
            value === 1
              ? `1 · ${t("q.confidence.min")}`
              : value === 5
                ? `5 · ${t("q.confidence.max")}`
                : String(value),
        }))}
      />
    ),
    cvStatus: choice("cvStatus"),
    applications: choice("applications"),
    obstacle: choice("obstacle"),
    time: choice("time"),
    mobility: choice("mobility"),
  };

  const subject = { type: "user" as const, id: user.id };
  const personalized = DIAGNOSTIC_GATE.levels.includes(
    await level(db, subject, DIAGNOSTIC_GATE.key),
  );
  const readiness = personalized
    ? await aiReadiness(db, user.id, "diagnostic", DIAGNOSTIC_GATE)
    : "entitlement";
  const withAi = personalized && readiness === "ready";
  const upsellPlan = personalized
    ? null
    : (cheapestPlanWhere(await listPublicPlans(db), ["talent"], (plan) =>
        DIAGNOSTIC_GATE.levels.includes(levelOf(plan, DIAGNOSTIC_GATE.key)),
      )?.name ?? null);
  const total = withAi ? DIAGNOSTIC_QUESTIONS_PERSONALIZED : DIAGNOSTIC_QUESTIONS;
  const extra = (
    <section aria-labelledby="part-more" className={cx(card, "flex flex-col gap-5")}>
      <h2 id="part-more" className={cx(cardTitle, "flex items-center gap-2")}>
        <AiOrb />
        {t("section", {
          current: diagnosticParts.length + 1,
          total: diagnosticParts.length + 1,
          name: t("part.more"),
        })}
      </h2>
      <TextArea
        id="achievement"
        name="achievement"
        label={t("q.achievement.text")}
        placeholder={t("q.achievement.placeholder")}
        rows={4}
        maxLength={1000}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-label">{t("q.values.text")}</legend>
        {valueAnswers.map((code) => (
          <Checkbox
            key={code}
            id={`values-${code}`}
            name="values"
            value={code}
            label={dynamic(t)(`q.values.${code}`)}
          />
        ))}
      </fieldset>
      <Choices
        legend={t("q.workStyle.text")}
        name="workStyle"
        required
        options={workStyleAnswers.map((code) => ({
          value: code,
          label: dynamic(t)(`q.workStyle.${code}`),
        }))}
      />
      <TextField id="feedback" name="feedback" label={t("q.feedback")} maxLength={300} />
      <TextField id="languages" name="languages" label={t("q.languages")} maxLength={200} />
      <TextField id="digital" name="digital" label={t("q.digital")} maxLength={200} />
      <TextField id="horizon" name="horizon" label={t("q.horizon")} maxLength={300} />
      <Checkbox id="useProfile" name="useProfile" value="on" label={t("q.useProfile")} />
    </section>
  );

  return (
    <>
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <CareerTabs active="diagnostic" />
      <p className="flex flex-wrap items-center gap-3 text-[13px] text-ardoise">
        <span
          className={cx(
            "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold",
            withAi ? "bg-sapin text-neon" : "bg-gris-clair text-sapin",
          )}
        >
          <Icon name="intelligence" className="size-3.5" />
          {withAi ? t("badge.personalized") : t("badge.simple")}
        </span>
        {withAi ? t("intro.personalized") : t("intro.simple")}
      </p>
      {upsellPlan && <Alert title={t("upsell", { plan: upsellPlan })} />}
      {personalized && readiness === "consent" && (
        <Alert title={tAi("consent.declined.state")}>
          <Link href="/app/parametres?onglet=confidentialite" className="font-medium underline">
            {tAi("consent.declined.cta")}
          </Link>
        </Alert>
      )}
      {personalized && readiness === "quota" && (
        <Alert tone="warning" title={tAi("credits.reached.title")} />
      )}
      {params.erreur && <Alert tone="error" title={t("error")} />}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form
          id="questions"
          action={submitDiagnostic}
          className="flex min-w-0 scroll-mt-24 flex-col gap-5"
        >
          {diagnosticParts.map((part, index) => (
            <section
              key={part.id}
              aria-labelledby={`part-${part.id}`}
              className={cx(card, "flex flex-col gap-6")}
            >
              <h2 id={`part-${part.id}`} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-up-texte">
                  {t("section", {
                    current: index + 1,
                    total: diagnosticParts.length,
                    name: t(`part.${part.id}`),
                  })}
                </span>
              </h2>
              {part.questions.map((id) => (
                <div key={id}>{questions[id]}</div>
              ))}
            </section>
          ))}
          {withAi && (
            <>
              <input type="hidden" name="personalized" value="1" />
              {extra}
            </>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className={pillClass("dark")}>
              {t("finish")}
              <Icon name="chev-r" className="size-4" />
            </button>
            <p className="text-sm text-ardoise">{t("progress", { current: total, total })}</p>
          </div>
        </form>
        <aside className="flex flex-col gap-5 self-start xl:sticky xl:top-6">
          <AiPanel>
            <AiBrand />
            <p className="text-sm leading-6">
              {withAi ? t("intro.personalized") : t("intro.simple")}
            </p>
          </AiPanel>
          <History history={history} />
          <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
            <Icon name="check" className="mt-px size-4 shrink-0 text-feuille" />
            {t("saved")}
          </p>
          <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
            <Icon name="lock" className="mt-px size-4 shrink-0" />
            {t("privacy")}
          </p>
        </aside>
      </div>
    </>
  );
}

/** One question with its answers as option cards (a radio button in each). */
function Choices({
  legend,
  name,
  options,
  required = false,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-3 text-[17px] leading-snug font-semibold">{legend}</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${name}-${option.value}`}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[14px] border border-brume bg-blanc px-4 py-2.5 text-sm hover:bg-creme has-checked:border-sapin has-checked:bg-lime-clair"
          >
            <input
              id={`${name}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              required={required}
              className="size-5 shrink-0 accent-sapin"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

async function History({
  history,
  currentId,
}: {
  history: { id: string; createdAt: Date; level: string }[];
  currentId?: string;
}) {
  const t = await getTranslations("career.diagnostic");
  const others = history.filter((item) => item.id !== currentId);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="history" className={cx(card, "flex flex-col gap-2")}>
      <h2 id="history" className={cardTitle}>
        {t("result.history")}
      </h2>
      <ul className="flex flex-col divide-y divide-brume">
        {others.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-3">
            <Link
              href={`/app/career/diagnostic?bilan=${item.id}`}
              className="text-sm underline-offset-4 hover:underline"
            >
              {formatDate(item.createdAt)}
            </Link>
            <span
              className={cx(
                "rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                item.level === "personalized" ? "bg-menthe-claire" : "bg-gris-clair",
              )}
            >
              {item.level === "personalized" ? t("badge.personalized") : t("badge.simple")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
