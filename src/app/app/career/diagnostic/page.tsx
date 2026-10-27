import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { DiagnosticFlow, type SkillSource } from "@/components/talent/diagnostic-flow";
import { FlowHead } from "@/components/talent/flow-head";
import { Notice } from "@/components/talent/notice";
import { TalentIcon } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { aiReadiness } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import {
  parseDiagnosticResult,
  parseDiagnosticV2,
  parsePersonalized,
} from "@/server/services/diagnostic";
import { DIAGNOSTIC_GATE } from "@/server/services/diagnostic-ai";
import {
  dimensions,
  educationAnswers,
  screensFor,
  type Draft,
} from "@/server/services/diagnostic-scoring";
import { demandedSkills, diagnosticPrefill, getDraft } from "@/server/services/diagnostic-store";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";
import { DiagnosticResult } from "./result";
import { DiagnosticWelcome } from "./welcome";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("diag");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * Career diagnostic (planche talent-4 § 5): the last result (or `?bilan=`), the start screen
 * (no result yet, or `?refaire=1`), then one question per screen (`?etape=`). Scores by the fixed
 * rules `diagnostic_scoring_v2` for everyone; the personalized level adds a summary by Orbi.
 * Without JavaScript the questions are one long form.
 */
export default async function DiagnosticPage({
  searchParams,
}: PageProps<"/app/career/diagnostic">) {
  const params = await searchParams;
  const user = await requireUser("/app/career/diagnostic");
  const t = await getTranslations();
  const history = await db.careerDiagnostic.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, createdAt: true, result: true, level: true },
  });
  const wanted = typeof params.bilan === "string" ? params.bilan : undefined;
  const latest = history[0];
  const current = wanted
    ? history.find((item) => item.id === wanted)
    : typeof params.etape !== "string" && !params.refaire
      ? latest
      : undefined;

  if (current) {
    const v2 = parseDiagnosticV2(current.result);
    const personal = current.level === "personalized" ? parsePersonalized(current.result) : null;
    const notice =
      params.ia === "unavailable"
        ? t("career.diagnostic.scan.fallback")
        : params.ia === "quota"
          ? t("ai.credits.reached.title")
          : params.ia === "consent"
            ? t("ai.consent.declined.state")
            : null;
    if (v2)
      return (
        <DiagnosticResult
          userId={user.id}
          id={current.id}
          date={current.createdAt}
          result={v2}
          summary={personal?.summary ?? null}
          notice={notice}
        />
      );
    const legacy = parseDiagnosticResult(current.result);
    if (legacy) return <LegacyResult result={legacy} />;
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
  const draft = await getDraft(db, user.id);
  const alerts = (
    <>
      {personalized && readiness === "consent" && (
        <Notice tone="err">
          {t("ai.consent.declined.state")}{" "}
          <Link href="/app/parametres?onglet=confidentialite" className="t-lien-d">
            {t("ai.consent.declined.cta")}
          </Link>
        </Notice>
      )}
      {personalized && readiness === "quota" && (
        <Notice tone="err">{t("ai.credits.reached.title")}</Notice>
      )}
      {params.erreur && <Notice tone="err">{t("career.diagnostic.error")}</Notice>}
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
        <DiagnosticWelcome
          alerts={alerts}
          withAi={withAi}
          again={Boolean(latest)}
          upsell={upsellPlan}
          latestId={latest?.id ?? null}
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
      ? { names: found.skills, offers: found.offers, scope: found.field ? "field" : found.scope }
      : { names: [], offers: 0, scope: "own" };
  const assessed = (initial.skillChecks ?? []).map((item) => item.skill);
  const tProfile = await getTranslations("talent.profile.education.level");
  const messages = await getMessages();
  const flowMessages = { career: { diagnostic: messages.career.diagnostic }, diag: messages.diag };

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/career/diagnostic?refaire=1"
        backLabel={t("diag.back")}
        history={false}
        title={t("diag.title")}
        end={
          <Link
            href={latest ? "/app/career/diagnostic" : "/app/profil/point"}
            className="t-bi t-press"
            aria-label={t("diag.flow.close")}
          >
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      {alerts}
      <NextIntlClientProvider messages={flowMessages as unknown as typeof messages}>
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
        />
      </NextIntlClientProvider>
    </div>
  );
}

/** A result of the first version (three readiness levels), kept for the talent's history. */
async function LegacyResult({
  result,
}: {
  result: NonNullable<ReturnType<typeof parseDiagnosticResult>>;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  return (
    <div className="t-flux">
      <FlowHead back="/app/profil/point" backLabel={t("diag.back")} title={t("diag.title")} />
      <Notice>{t("career.diagnostic.result.legacy")}</Notice>
      <section aria-labelledby="dg-anciens-atouts" className="t-verre t-fb-c">
        <h2 id="dg-anciens-atouts" className="t-h4">
          {t("career.diagnostic.result.strengths")}
        </h2>
        {(result.strengths.length > 0
          ? result.strengths.map((key) => d(`career.diagnostic.rule.strength.${key}`))
          : [t("career.diagnostic.rule.strength.none")]
        ).map((text) => (
          <div key={text} className="t-pt t-ok">
            <i aria-hidden>
              <TalentIcon name="valider" size="xs" />
            </i>
            <span>{text}</span>
          </div>
        ))}
      </section>
      <section aria-labelledby="dg-anciennes-priorites" className="t-verre t-fb-c">
        <h2 id="dg-anciennes-priorites" className="t-h4">
          {t("career.diagnostic.result.priorities")}
        </h2>
        {result.priorities.map((key) => (
          <div key={key} className="t-pt t-ko">
            <i aria-hidden>
              <TalentIcon name="plus" size="xs" />
            </i>
            <span>{d(`career.diagnostic.rule.priority.${key}`)}</span>
          </div>
        ))}
      </section>
      <div className="t-verre t-fort t-bas-f">
        <Link href="/app/career/diagnostic?refaire=1" className="t-bt t-sec t-m t-press">
          {t("diag.again")}
        </Link>
        <Link href="/app/career/plan" className="t-bt t-p t-pl t-press">
          {t("diag.plan")}
        </Link>
      </div>
    </div>
  );
}
