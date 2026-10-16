import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { DiagnosticFlow, type SkillSource } from "@/components/career/diagnostic-flow";
import { AiBrand, AiPanel, card, cardTitle, pillClass } from "@/components/career/kit";
import type { ScanCard } from "@/components/motion/scan";
import { Alert } from "@/components/ui";
import { cx } from "@/lib/cx";
import { dynamic } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { aiReadiness } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can, level, limit } from "@/server/entitlements";
import {
  parseDiagnosticResult,
  parseDiagnosticV2,
  parsePersonalized,
  stepLinks,
  upgradeOptions,
} from "@/server/services/diagnostic";
import { DIAGNOSTIC_GATE } from "@/server/services/diagnostic-ai";
import {
  dimensions,
  educationAnswers,
  screensFor,
  type Draft,
} from "@/server/services/diagnostic-scoring";
import {
  demandedSkills,
  diagnosticBadge,
  diagnosticPrefill,
  getDraft,
} from "@/server/services/diagnostic-store";
import {
  cheapestPlanWhere,
  levelOf,
  listPublicPlans,
  talentPlanFor,
} from "@/server/services/plans";
import { DiagnosticResultV2 } from "./result";
import { DiagnosticWelcome } from "./welcome";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.diagnostic");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * Career diagnostic (partie 07 § 4, docs/experience-animee § 5): the welcome screen, then one
 * question per screen (`?etape=`), the scan, and the result (`?bilan=`). Scores by the fixed rules
 * `diagnostic_scoring_v2` for everyone; the personalized level adds four questions and a summary
 * by Jumanly Intelligence. Without JavaScript the questions are one long form.
 */
export default async function DiagnosticPage({
  searchParams,
}: PageProps<"/app/career/diagnostic">) {
  const params = await searchParams;
  const user = await requireUser("/app/career/diagnostic");
  const t = await getTranslations("career.diagnostic");
  const tAi = await getTranslations("ai");
  const history = await db.careerDiagnostic.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      result: true,
      level: true,
      remindAt: true,
      remindedAt: true,
    },
  });
  const wanted = typeof params.bilan === "string" ? params.bilan : undefined;
  const current = wanted ? history.find((item) => item.id === wanted) : undefined;

  if (current) {
    const v2 = parseDiagnosticV2(current.result);
    const legacy = parseDiagnosticResult(current.result);
    const personal = current.level === "personalized" ? parsePersonalized(current.result) : null;
    const older = history[history.findIndex((item) => item.id === current.id) + 1];
    const aside = (
      <>
        <History history={history} currentId={current.id} />
        <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
          <Icon name="lock" className="mt-px size-4 shrink-0" />
          {t("privacy")}
        </p>
      </>
    );
    return (
      <>
        <AppPageHeader eyebrow={t("eyebrow")} title={t("result.title")} />
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
          {t("result.date", { date: current.createdAt })}
        </p>
        {params.ia === "unavailable" && <Alert tone="warning" title={t("scan.fallback")} />}
        {params.ia === "quota" && <Alert tone="warning" title={tAi("credits.reached.title")} />}
        {params.ia === "consent" && <Alert title={tAi("consent.declined.state")} />}
        {v2 ? (
          <DiagnosticResultV2
            id={current.id}
            result={v2}
            personal={personal}
            previous={
              older ? { date: older.createdAt, result: parseDiagnosticV2(older.result) } : null
            }
            reminder={current.remindAt}
            reminded={current.remindedAt}
            upgrades={v2 ? await upgradesFor(user.id) : []}
            aside={aside}
          />
        ) : legacy ? (
          <LegacyResult
            result={legacy}
            summary={personal?.summary ?? null}
            personal={Boolean(personal)}
            strengthTexts={personal?.strengthTexts ?? []}
            aside={aside}
          />
        ) : null}
      </>
    );
  }

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
  const [badgeFacts, draft] = await Promise.all([
    diagnosticBadge(db, user.id),
    getDraft(db, user.id),
  ]);
  const badge: ScanCard = {
    initials: badgeFacts.initials,
    firstName: badgeFacts.firstName,
    targetJob: badgeFacts.targetJob ?? t("card.noTarget"),
    city: badgeFacts.city,
    skills: t("card.skills", { count: badgeFacts.skills }),
    label: t("card.label"),
  };
  const alerts = (
    <>
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
    </>
  );
  const header = (
    <>
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} />
    </>
  );

  if (typeof params.etape !== "string") {
    const resumeAt = draft
      ? screensFor(
          draft.answers,
          (draft.answers.skillChecks ?? []).map((item) => item.skill),
          withAi,
        )[draft.step]
      : undefined;
    return (
      <>
        {header}
        {alerts}
        <DiagnosticWelcome
          badge={badge}
          withAi={withAi}
          resume={
            draft
              ? resumeAt && resumeAt.dimension !== "more"
                ? dimensions.indexOf(resumeAt.dimension) + 1
                : resumeAt
                  ? dimensions.length
                  : 1
              : null
          }
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <AiPanel>
            <AiBrand />
            <p className="text-sm leading-6">
              {withAi ? t("intro.personalized") : t("intro.simple")}
            </p>
            <p className="text-[13px] leading-5 text-blanc/85">{t("result.simple.note")}</p>
          </AiPanel>
          <History history={history} />
        </div>
      </>
    );
  }

  const resume = params.etape === "reprendre" && draft ? draft : null;
  const useProfile = !resume && params.profil === "1";
  const prefill = await diagnosticPrefill(db, user.id);
  const initial: Draft = resume
    ? resume.answers
    : { ...(useProfile ? prefill.draft : {}), useProfile };
  const found = await demandedSkills(db, initial.targetRole ?? "");
  const skills: SkillSource =
    found.skills.length > 0
      ? { names: found.skills, offers: found.offers, scope: found.scope }
      : { names: [], offers: 0, scope: "own" };
  const assessed = (initial.skillChecks ?? []).map((item) => item.skill);
  const tProfile = await getTranslations("talent.profile.education.level");
  const messages = await getMessages();
  const diagnosticMessages = { career: { diagnostic: messages.career.diagnostic } };

  return (
    <>
      {header}
      {alerts}
      <NextIntlClientProvider messages={diagnosticMessages as unknown as typeof messages}>
        <DiagnosticFlow
          initial={initial}
          initialIndex={resume?.step ?? 0}
          skills={
            resume && assessed.length > 0 && skills.scope === "own"
              ? { names: assessed, offers: 0, scope: "own" }
              : skills
          }
          personalized={withAi}
          prefilled={useProfile ? Object.keys(prefill.draft) : []}
          cvScore={prefill.cvScore}
          education={educationAnswers.map((code) => ({ value: code, label: tProfile(code) }))}
          badge={badge}
        />
      </NextIntlClientProvider>
    </>
  );
}

/**
 * « Pour aller plus loin »: the paid options the talent does not have yet, each with the cheapest
 * plan that opens it (from the database, never a plan name in code, CLAUDE.md § 2).
 */
async function upgradesFor(userId: string) {
  const subject = { type: "user" as const, id: userId };
  const plans = await listPublicPlans(db);
  const missing = await Promise.all(
    upgradeOptions.map(async (option) => {
      const has =
        "levels" in option
          ? (option.levels as readonly string[]).includes(await level(db, subject, option.key))
          : option.key.endsWith(".monthly")
            ? (await limit(db, subject, option.key)) !== 0
            : await can(db, subject, option.key);
      const plan = has
        ? ""
        : talentPlanFor(plans, option.key, "levels" in option ? [...option.levels] : undefined);
      return plan ? { code: option.code, icon: option.icon, plan } : null;
    }),
  );
  return missing.filter((item) => item !== null);
}

/** Result of a diagnostic of the first version (three readiness levels), kept for the history. */
async function LegacyResult({
  result,
  summary,
  personal,
  strengthTexts,
  aside,
}: {
  result: NonNullable<ReturnType<typeof parseDiagnosticResult>>;
  summary: string | null;
  personal: boolean;
  strengthTexts: string[];
  aside: ReactNode;
}) {
  const t = await getTranslations("career.diagnostic");
  const d = dynamic(t);
  const levels = ["low", "medium", "high"] as const;
  const reached = levels.indexOf(result.readiness);
  const strengths =
    strengthTexts.length > 0
      ? strengthTexts
      : result.strengths.length === 0
        ? [t("rule.strength.none")]
        : result.strengths.map((key) => d(`rule.strength.${key}`));
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Alert title={t("result.legacy")} />
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
                  className={cx("text-xs", index === reached ? "font-semibold" : "text-ardoise")}
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
            <ul className="flex flex-col gap-3">
              {strengths.map((text) => (
                <li key={text} className="flex gap-3 text-[15px] leading-6">
                  <Icon name="check" className="mt-1 size-4 shrink-0 text-feuille" />
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
                <li key={key} className="text-[15px] leading-6 font-semibold">
                  {d(`rule.priority.${key}`)}
                </li>
              ))}
            </ol>
          </section>
        </div>
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
        </section>
      </div>
      <aside className="flex flex-col gap-5">
        <AiPanel>
          <AiBrand />
          {summary && <p className="text-sm leading-6 whitespace-pre-line">{summary}</p>}
          <p className="text-[13px] leading-5 text-blanc/85">
            {personal ? t("result.personalized.note") : t("result.simple.note")}
          </p>
        </AiPanel>
        <Link href="/app/career/diagnostic" className={pillClass("outline")}>
          {t("restart")}
        </Link>
        {aside}
      </aside>
    </div>
  );
}

async function History({
  history,
  currentId,
}: {
  history: { id: string; createdAt: Date; level: string; result: unknown }[];
  currentId?: string;
}) {
  const t = await getTranslations("career.diagnostic");
  const d = dynamic(t);
  const others = history.filter((item) => item.id !== currentId);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="history" className={cx(card, "flex flex-col gap-2")}>
      <h2 id="history" className={cardTitle}>
        {t("result.history")}
      </h2>
      <ul className="flex flex-col divide-y divide-brume">
        {others.map((item) => {
          const v2 = parseDiagnosticV2(item.result as never);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <Link
                href={`/app/career/diagnostic?bilan=${item.id}`}
                className="text-sm underline-offset-4 hover:underline"
              >
                {formatDate(item.createdAt)}
              </Link>
              <span className="flex flex-wrap justify-end gap-1.5">
                {v2 && (
                  <span className="rounded-pill bg-lime-clair px-2.5 py-1 text-[11px] font-semibold">
                    {d(`stage.${v2.stage}`)} · {v2.score}
                  </span>
                )}
                <span
                  className={cx(
                    "rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                    item.level === "personalized" ? "bg-menthe-claire" : "bg-gris-clair",
                  )}
                >
                  {item.level === "personalized" ? t("badge.personalized") : t("badge.simple")}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
