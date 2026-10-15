import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { CareerArt } from "@/components/career/home/art";
import { CareerGroup, CareerHero, CareerUpgradeBand } from "@/components/career/home/sections";
import { CareerToolCard, ToolLink, type ToolBadge } from "@/components/career/home/tool-card";
import { AiBrand, AiPanel, CareerTabs, pillClass, Why } from "@/components/career/kit";
import { Gauge } from "@/components/motion/gauge";
import { initialsOf } from "@/components/hire/kit";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { latestLinkedin, listDocuments } from "@/server/services/career-documents";
import { careerJourney, type JourneyStep } from "@/server/services/career-journey";
import {
  isEntryPlan,
  lockableTools,
  planForTool,
  upgradeOffer,
  type LockableTool,
} from "@/server/services/career-offer";
import { parseCv } from "@/server/services/cv";
import { cvScore, targetSkillsFor, templateSuggestions } from "@/server/services/cv-coach";
import { parseDiagnosticV2 } from "@/server/services/diagnostic";
import { dimensions, stageFor, stages } from "@/server/services/diagnostic-scoring";
import { interviewQuota } from "@/server/services/interview-sim";
import { upcomingTalentInterviews } from "@/server/services/interviews";
import { listPublicPlans } from "@/server/services/plans";
import { getPlan } from "@/server/services/progress-plan";
import { listProjects, portfolioLevel } from "@/server/services/portfolio";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.home");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * Career home v2 (docs/refonte-career/BRIEF-CAREER-V2.md): the hero with the four-step journey,
 * the tools in three groups (take stock, prepare applications, train), the interview AI panel and
 * the offer band while a tool is locked. Every figure is real; locks, plan names and prices come
 * from the entitlements and the public plans.
 */
export default async function CareerPage() {
  const user = await requireUser("/app/career");
  const t = await getTranslations("career.home");
  const tDiagnostic = await getTranslations("career.diagnostic");
  const tCoach = await getTranslations("ai.cvCoach");
  const d = dynamic(tDiagnostic);
  const dCoach = dynamic(tCoach);
  const subject = { type: "user" as const, id: user.id };
  const [
    lastDiagnostic,
    primaryCv,
    targets,
    documentsOpen,
    linkedinOpen,
    textQuota,
    oralQuota,
    portfolio,
    plans,
    plan,
    documents,
    linkedin,
    upcoming,
    profile,
    applications,
  ] = await Promise.all([
    db.careerDiagnostic.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, result: true },
    }),
    db.document.findFirst({
      where: { kind: "cv", profile: { userId: user.id } },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      select: { id: true, content: true },
    }),
    targetSkillsFor(db, user.id),
    can(db, subject, "career.documents"),
    can(db, subject, "career.linkedin"),
    interviewQuota(db, user.id, "text"),
    interviewQuota(db, user.id, "voice"),
    portfolioLevel(db, user.id),
    listPublicPlans(db),
    getPlan(db, user.id),
    listDocuments(db, user.id),
    latestLinkedin(db, user.id),
    upcomingTalentInterviews(db, user.id),
    db.talentProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.application.count({ where: { profile: { userId: user.id } } }),
  ]);
  const projects = profile ? await listProjects(db, profile.id) : [];
  const cvContent = primaryCv ? parseCv(primaryCv.content) : null;
  const scored = cvContent ? cvScore(cvContent, targets.skills) : null;
  const score = scored?.total ?? null;
  const tip = cvContent ? templateSuggestions(cvContent, targets.skills)[0] : undefined;
  const stepsDone = plan?.steps.filter((step) => step.done).length ?? 0;
  const stepsTotal = plan?.steps.length ?? 0;
  const v2 = lastDiagnostic ? parseDiagnosticV2(lastDiagnostic.result) : null;
  const stage = v2 ? stageFor(v2.score) : null;

  const open: Record<LockableTool, boolean> = {
    documents: documentsOpen,
    linkedin: linkedinOpen,
    interviews: textQuota.limit !== 0,
    portfolio: portfolio !== "none",
  };
  const locked = lockableTools.filter((tool) => !open[tool]);
  const offer = upgradeOffer(plans, locked);

  const hrefs = {
    diagnostic: lastDiagnostic
      ? `/app/career/diagnostic?bilan=${lastDiagnostic.id}`
      : "/app/career/diagnostic",
    cv: primaryCv ? `/app/career/cv/${primaryCv.id}` : "/app/career/cv",
    documents: "/app/career/documents",
    linkedin: "/app/career/linkedin",
    interviews: "/app/career/entretiens",
    plan: "/app/career/plan",
    portfolio: "/app/career/portfolio",
  };
  const journey = careerJourney({
    diagnosticAt: lastDiagnostic?.createdAt ?? null,
    cvScore: score,
    documents: documents.length,
    hasLinkedin: linkedin !== null,
    projects: projects.length,
    applications,
    simulationsThisMonth: textQuota.used + oralQuota.used,
  });
  const stepHrefs: Record<JourneyStep, string> = {
    point: hrefs.diagnostic,
    cv: hrefs.cv,
    apply: open.documents ? hrefs.documents : "/app/jobs",
    train: hrefs.interviews,
  };
  const band = scored ? dCoach(`score.level.${scored.level}`) : null;

  /** Badge, footer and action of a tool that a plan may lock. */
  const gated = (tool: LockableTool, state: ReactNode, action: ReactNode) => {
    if (open[tool]) return { locked: false, state, action };
    const opener = planForTool(plans, tool);
    const name = opener?.name ?? "";
    const badge: ToolBadge | undefined = opener
      ? { kind: "locked", label: name, entry: isEntryPlan(plans, opener) }
      : undefined;
    return {
      locked: true,
      badge,
      state: (
        <span>
          {opener?.priceCents
            ? t("locked.withPrice", { plan: name, price: formatUsd(opener.priceCents) })
            : t("locked.with", { plan: name })}
        </span>
      ),
      action: <ToolLink href="/app/abonnement">{t("locked.cta")}</ToolLink>,
    };
  };
  const included: ToolBadge = { kind: "included", label: t("badge.included") };

  const documentsCard = gated(
    "documents",
    <b className="font-semibold text-sapin">{t("documents.count", { count: documents.length })}</b>,
    <ToolLink href={hrefs.documents}>{t("open")}</ToolLink>,
  );
  const linkedinCard = gated(
    "linkedin",
    <b className="font-semibold text-sapin">
      {linkedin ? t("linkedin.last", { date: linkedin.createdAt }) : t("linkedin.none")}
    </b>,
    <ToolLink href={hrefs.linkedin}>{t("open")}</ToolLink>,
  );
  const portfolioCard = gated(
    "portfolio",
    <b className="font-semibold text-sapin">{t("portfolio.count", { count: projects.length })}</b>,
    <ToolLink href={hrefs.portfolio}>{t("open")}</ToolLink>,
  );
  const interviewsCard = gated(
    "interviews",
    <b className="font-semibold text-sapin">
      {t("quota", { used: textQuota.used, quota: Math.max(0, textQuota.limit) })}
    </b>,
    <ToolLink href={hrefs.interviews}>{t("interviews.cta")}</ToolLink>,
  );
  const next = upcoming.find((interview) => interview.startsAt);
  const toolTitle: Record<LockableTool, string> = {
    documents: t("documents.title"),
    linkedin: t("linkedin.title"),
    interviews: t("interviews.title"),
    portfolio: t("portfolio.title"),
  };

  return (
    <>
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <CareerTabs active="home" locked={locked} />

      <CareerHero
        journey={journey}
        diagnosticAt={lastDiagnostic?.createdAt ?? null}
        cv={score === null ? null : { score, band: band ?? "" }}
        continueHref={journey.current ? stepHrefs[journey.current] : hrefs.cv}
        diagnosticHref={hrefs.diagnostic}
      />

      <CareerGroup
        id="career-point"
        index={1}
        title={t("group.point.title")}
        lead={t("group.point.lead")}
      >
        <article
          id="career-diagnostic"
          aria-labelledby="career-diagnostic-title"
          className="jm-ch-card relative grid min-w-0 overflow-hidden rounded-[28px] bg-nuit text-blanc shadow-[0_1px_0_rgb(15_63_55/0.04),0_18px_40px_-22px_rgb(15_63_55/0.35)] sm:col-span-12 md:grid-cols-[minmax(0,1fr)_260px] xl:col-span-7"
        >
          <span className="absolute top-3.5 right-3.5 z-[2] rounded-pill bg-lime px-[11px] py-1.5 text-[11px] font-semibold text-sapin">
            {t("badge.included")}
          </span>
          <div className="flex min-w-0 flex-col gap-3 px-[22px] pt-14 pb-0 md:pt-7 md:pl-7">
            <div className="flex items-center gap-3">
              <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-lime/16 text-lime">
                <Icon name="objectif" className="size-5" />
              </span>
              <h3 id="career-diagnostic-title" className="text-lg leading-tight font-semibold">
                <Link href={hrefs.diagnostic} className="underline-offset-4 hover:underline">
                  {t("diagnostic.title")}
                </Link>
              </h3>
            </div>
            <p className="text-[13.5px] leading-[1.55] text-[#BFD6CF]">{t("diagnostic.descV2")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {stages.map((key) => (
                <li
                  key={key}
                  aria-current={key === stage ? "step" : undefined}
                  className={cx(
                    "rounded-pill border px-2.5 py-[5px] text-[11px]",
                    key === stage
                      ? "border-lime bg-lime font-semibold text-sapin"
                      : "border-blanc/18 text-[#A9C3BB]",
                  )}
                >
                  {d(`stage.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:row-span-2 md:flex md:flex-col">
            <CareerArt
              tool="diagnostic"
              axes={
                v2
                  ? v2.dimensions.map((item) => ({
                      key: item.key,
                      label: d(`dimension.${item.key}.short`),
                      value: item.score,
                    }))
                  : dimensions.map((key) => ({
                      key,
                      label: d(`dimension.${key}.short`),
                      value: 0,
                    }))
              }
              radarTitle={t("diagnostic.title")}
              radarText={
                v2
                  ? v2.dimensions
                      .map((item) => `${d(`dimension.${item.key}.name`)} ${item.score}`)
                      .join(", ")
                  : t("diagnostic.none")
              }
            />
          </div>
          <div className="mt-auto px-[22px] pb-[18px] md:pb-[22px] md:pl-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blanc/12 pt-3.5">
              <p className="flex flex-col gap-1 text-xs text-[#A9C3BB]">
                {lastDiagnostic ? (
                  <b className="font-semibold text-blanc">
                    {t("diagnostic.lastDone", { date: lastDiagnostic.createdAt })}
                  </b>
                ) : (
                  <b className="font-semibold text-blanc">{t("diagnostic.none")}</b>
                )}
              </p>
              <ToolLink href={hrefs.diagnostic} tone="dark">
                {lastDiagnostic ? t("diagnostic.cta.view") : t("diagnostic.cta.start")}
              </ToolLink>
            </div>
          </div>
        </article>

        <CareerToolCard
          id="career-plan"
          href={hrefs.plan}
          title={t("plan.title")}
          description={t("plan.desc")}
          icon="calendrier"
          className="sm:col-span-12 xl:col-span-5"
          art={
            <CareerArt
              tool="plan"
              checked={stepsTotal > 0 ? Math.round((3 * stepsDone) / stepsTotal) : 0}
            />
          }
          state={
            plan ? (
              <>
                <b className="font-semibold text-sapin">
                  {t("plan.steps", { done: stepsDone, total: stepsTotal })}
                </b>
                <Gauge
                  value={stepsTotal > 0 ? (100 * stepsDone) / stepsTotal : 0}
                  className="h-[5px] w-[140px]"
                />
              </>
            ) : (
              <>
                <span>{t("plan.none")}</span>
                {lastDiagnostic && (
                  <b className="font-semibold text-sapin">{t("plan.fromDiagnostic")}</b>
                )}
              </>
            )
          }
          action={<ToolLink href={hrefs.plan}>{plan ? t("plan.cta") : t("plan.create")}</ToolLink>}
        />
      </CareerGroup>

      <CareerGroup
        id="career-apply"
        index={2}
        title={t("group.apply.title")}
        lead={t("group.apply.lead")}
      >
        <CareerToolCard
          id="career-cv"
          href={hrefs.cv}
          title={t("cv.title")}
          description={t("cv.descV2")}
          icon="cv"
          badge={included}
          stretchArt
          className="sm:col-span-12 lg:col-span-6 lg:row-span-2"
          art={
            <CareerArt
              tool="cv"
              initials={initialsOf(user.name)}
              score={
                score === null
                  ? null
                  : {
                      value: score,
                      title: t("float.cv"),
                      sub: t("float.cvSub", { score, band: band ?? "" }),
                    }
              }
              tip={
                tip
                  ? dCoach(
                      `suggestion.${tip.kind}.title`,
                      tip.skill ? { skill: tip.skill } : undefined,
                    )
                  : null
              }
            />
          }
          extras={
            <ul className="flex flex-wrap gap-2">
              {(["templates", "pdf", "score"] as const).map((key) => (
                <li
                  key={key}
                  className="rounded-pill bg-lime-clair px-[11px] py-1.5 text-xs font-medium"
                >
                  {t(`cv.chip.${key}`)}
                </li>
              ))}
            </ul>
          }
          state={
            score === null ? (
              <b className="font-semibold text-sapin">{t("cv.none")}</b>
            ) : (
              <>
                <b className="font-semibold text-sapin">{t("cv.score", { score })}</b>
                <Gauge value={score} className="h-[5px] w-[140px]" />
              </>
            )
          }
          action={
            <Link href={hrefs.cv} className={pillClass("dark", "sm", "min-h-11 lg:min-h-0")}>
              {t("cv.cta")}
              <Icon name="chev-r" className="jm-ch-chev size-4" />
            </Link>
          }
        />
        <CareerToolCard
          id="career-documents"
          href={hrefs.documents}
          title={t("documents.title")}
          description={t("documents.desc")}
          icon="doc"
          className="sm:col-span-6 lg:col-span-3"
          art={<CareerArt tool="documents" />}
          {...documentsCard}
        />
        <CareerToolCard
          id="career-linkedin"
          href={hrefs.linkedin}
          title={t("linkedin.title")}
          description={t("linkedin.desc")}
          icon="partager"
          className="sm:col-span-6 lg:col-span-3"
          art={<CareerArt tool="linkedin" initials={initialsOf(user.name)} />}
          {...linkedinCard}
        />
        <CareerToolCard
          id="career-portfolio"
          href={hrefs.portfolio}
          title={t("portfolio.title")}
          description={t("portfolio.desc")}
          icon="lien"
          className="sm:col-span-12 lg:col-span-6"
          art={<CareerArt tool="portfolio" />}
          {...portfolioCard}
        />
      </CareerGroup>

      <CareerGroup
        id="career-train"
        index={3}
        title={t("group.train.title")}
        lead={t("group.train.lead")}
      >
        <CareerToolCard
          id="career-interviews"
          href={hrefs.interviews}
          title={t("interviews.title")}
          description={t("interviews.desc")}
          icon="mic"
          className="sm:col-span-12 xl:col-span-7"
          art={<CareerArt tool="interviews" question={t("interviews.question")} />}
          {...interviewsCard}
        />
        <CareerToolCard
          id="career-tips"
          href={null}
          title={t("tips.title")}
          description={t("tips.desc")}
          icon="eye"
          soon
          badge={{ kind: "soon", label: t("later") }}
          className="sm:col-span-12 xl:col-span-5"
          art={<CareerArt tool="tips" />}
          state={<span>{t("tips.soon")}</span>}
        />
      </CareerGroup>

      {next && (
        <AiPanel labelledBy="career-ai" className="lg:max-w-[560px]">
          <AiBrand />
          <h2 id="career-ai" className="text-lg leading-snug font-semibold lg:text-xl">
            {t("ai.title", { organization: next.organization.name })}
          </h2>
          <p className="text-sm leading-5 text-blanc/85">{t("ai.body")}</p>
          <Why dark>
            {[
              t("ai.why", { date: next.startsAt! }),
              oralQuota.limit > 0
                ? t("ai.left", { count: Math.max(0, oralQuota.limit - oralQuota.used) })
                : null,
            ]
              .filter(Boolean)
              .join(" ")}
          </Why>
          <Link href="/app/career/entretiens" className={pillClass("lime", "sm", "self-start")}>
            {t("ai.start")}
          </Link>
        </AiPanel>
      )}

      {offer && (
        <CareerUpgradeBand
          index={4}
          plan={offer.plan.name}
          price={formatUsd(offer.plan.priceCents ?? 0)}
          tools={offer.tools.map((tool) => toolTitle[tool])}
        />
      )}
    </>
  );
}
