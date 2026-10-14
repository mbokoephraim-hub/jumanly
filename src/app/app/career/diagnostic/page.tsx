import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AiOrb } from "@/components/brand/ai-orb";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  RadioGroup,
  TextArea,
  TextField,
} from "@/components/ui";
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
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Badge tone="career">{personal ? t("badge.personalized") : t("badge.simple")}</Badge>
          <h1 className="text-h1">{t("result.title")}</h1>
          <p className="text-ardoise">{t("result.date", { date: current.createdAt })}</p>
        </header>
        {params.ia === "unavailable" && <Alert tone="error" title={tAi("card.error")} />}
        {params.ia === "quota" && <Alert tone="warning" title={tAi("credits.reached.title")} />}
        {params.ia === "consent" && <Alert title={tAi("consent.declined.state")} />}
        {personal && personal.summary && (
          <Card tone="intelligence">
            <p className="flex items-center gap-2 text-label">
              <AiOrb />
              {tAi("brand")}
            </p>
            <p className="mt-2 whitespace-pre-line">{personal.summary}</p>
          </Card>
        )}
        <Card tone="career">
          <p className="text-label">{t("result.readiness.text")}</p>
          <p className="mt-1 text-h2">{t(`result.readiness.${result.readiness}`)}</p>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-h2">{t("result.strengths")}</h2>
            {result.skills.length > 0 && (
              <p className="mt-3">
                {t("result.namedSkills", { skills: result.skills.join(", ") })}
              </p>
            )}
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
              {personal && personal.strengthTexts.length > 0 ? (
                personal.strengthTexts.map((text) => <li key={text}>{text}</li>)
              ) : result.strengths.length === 0 ? (
                <li>{t("rule.strength.none")}</li>
              ) : (
                result.strengths.map((key) => <li key={key}>{t(`rule.strength.${key}`)}</li>)
              )}
            </ul>
          </Card>
          <Card>
            <h2 className="text-h2">{t("result.priorities")}</h2>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
              {result.priorities.map((key) => (
                <li key={key}>{t(`rule.priority.${key}`)}</li>
              ))}
            </ol>
          </Card>
        </div>
        <Card>
          <h2 className="text-h2">{t("result.roles")}</h2>
          <p className="mt-3">
            {result.roles.length > 0 ? result.roles.join(", ") : t("result.rolesEmpty")}
          </p>
        </Card>
        <Card>
          <h2 className="text-h2">{t("result.nextSteps")}</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-3 pl-5">
            {result.steps.map((step) => (
              <li key={step}>
                <span className="flex flex-wrap items-center justify-between gap-3">
                  <span>{t(`rule.step.${step}`)}</span>
                  <ButtonLink href={stepLinks[step]} variant="secondary" size="sm">
                    {t("rule.step.cta")}
                  </ButtonLink>
                </span>
              </li>
            ))}
          </ol>
        </Card>
        <p className="text-sm text-ardoise">
          {personal ? t("result.personalized.note") : t("result.simple.note")}
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/app/career/plan">{t("result.createPlan")}</ButtonLink>
          <ButtonLink href="/app/career/diagnostic#questions" variant="secondary">
            {t("restart")}
          </ButtonLink>
        </div>
        <History history={history} currentId={current.id} />
      </div>
    );
  }

  const tProfile = await getTranslations("talent.profile.education.level");
  const choice = (id: ChoiceQuestion) => (
    <RadioGroup
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
      <RadioGroup
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
      <RadioGroup
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
    <section aria-labelledby="part-more" className="flex flex-col gap-5 rounded-card bg-blanc p-6">
      <h2 id="part-more" className="flex items-center gap-2 text-h2">
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
      <RadioGroup
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge tone="career">{withAi ? t("badge.personalized") : t("badge.simple")}</Badge>
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{withAi ? t("intro.personalized") : t("intro.simple")}</p>
        <p className="text-sm text-ardoise">{t("privacy")}</p>
      </header>
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
      <form id="questions" action={submitDiagnostic} className="flex scroll-mt-24 flex-col gap-6">
        {diagnosticParts.map((part, index) => (
          <section
            key={part.id}
            aria-labelledby={`part-${part.id}`}
            className="flex flex-col gap-5 rounded-card bg-blanc p-6"
          >
            <h2 id={`part-${part.id}`} className="text-h2">
              {t("section", {
                current: index + 1,
                total: diagnosticParts.length,
                name: t(`part.${part.id}`),
              })}
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
        <p className="text-sm text-ardoise">{t("progress", { current: total, total })}</p>
        <div>
          <Button type="submit">{t("finish")}</Button>
        </div>
      </form>
      <History history={history} />
    </div>
  );
}

async function History({
  history,
  currentId,
}: {
  history: { id: string; createdAt: Date }[];
  currentId?: string;
}) {
  const t = await getTranslations("career.diagnostic");
  const others = history.filter((item) => item.id !== currentId);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="history" className="flex flex-col gap-3">
      <h2 id="history" className="text-h2">
        {t("result.history")}
      </h2>
      <ul className="flex flex-col gap-2">
        {others.map((item) => (
          <li key={item.id}>
            <Link href={`/app/career/diagnostic?bilan=${item.id}`} className="underline">
              {formatDate(item.createdAt)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
