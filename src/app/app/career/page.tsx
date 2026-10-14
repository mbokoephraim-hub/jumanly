import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import {
  AiBrand,
  AiPanel,
  card,
  CareerTabs,
  IconTile,
  pillClass,
  Why,
} from "@/components/career/kit";
import { Pattern } from "@/components/site/marketing";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { latestLinkedin, listDocuments } from "@/server/services/career-documents";
import { parseCv } from "@/server/services/cv";
import { cvScore, targetSkillsFor } from "@/server/services/cv-coach";
import { interviewQuota } from "@/server/services/interview-sim";
import { upcomingTalentInterviews } from "@/server/services/interviews";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { getPlan } from "@/server/services/progress-plan";
import { listProjects, PORTFOLIO_KEY, portfolioLevel } from "@/server/services/portfolio";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.home");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

type Tool = {
  key: string;
  title: string;
  desc: string;
  href: string;
  icon: IconName;
  info: string;
  action: string;
  lock?: string;
};

/** Career home (partie 07 § 4, mockup 03-08): the figures of the moment and every Career tool. */
export default async function CareerPage() {
  const user = await requireUser("/app/career");
  const t = await getTranslations("career.home");
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
  ] = await Promise.all([
    db.careerDiagnostic.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
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
  ]);
  const projects = profile ? await listProjects(db, profile.id) : [];
  const score = primaryCv ? cvScore(parseCv(primaryCv.content), targets.skills).total : null;
  const stepsDone = plan?.steps.filter((step) => step.done).length ?? 0;
  const stepsTotal = plan?.steps.length ?? 0;
  const simulations = {
    used: textQuota.used + oralQuota.used,
    limit: Math.max(0, textQuota.limit) + Math.max(0, oralQuota.limit),
  };
  const lockFor = (open: boolean, gate: string) =>
    open ? undefined : t("lock", { plan: talentPlanFor(plans, gate) });

  const stats = [
    {
      label: t("stats.cv"),
      value: score === null ? t("stats.none") : String(score),
      unit: t("stats.cvUnit"),
    },
    {
      label: t("stats.plan"),
      value: plan ? t("stats.ratio", { value: stepsDone, max: stepsTotal }) : t("stats.none"),
      unit: t("stats.planUnit"),
    },
    {
      label: t("stats.interviews"),
      value:
        simulations.limit > 0
          ? t("stats.ratio", { value: simulations.used, max: simulations.limit })
          : t("stats.none"),
      unit: t("stats.interviewsUnit"),
    },
  ];

  const tools: Tool[] = [
    {
      key: "diagnostic",
      title: t("diagnostic.title"),
      desc: t("diagnostic.desc"),
      href: lastDiagnostic
        ? `/app/career/diagnostic?bilan=${lastDiagnostic.id}`
        : "/app/career/diagnostic",
      icon: "objectif",
      info: lastDiagnostic
        ? t("diagnostic.lastDone", { date: lastDiagnostic.createdAt })
        : t("diagnostic.none"),
      action: lastDiagnostic ? t("diagnostic.cta.view") : t("diagnostic.cta.start"),
    },
    {
      key: "cv",
      title: t("cv.title"),
      desc: t("cv.desc"),
      href: primaryCv ? `/app/career/cv/${primaryCv.id}` : "/app/career/cv",
      icon: "doc",
      info: score === null ? t("cv.none") : t("cv.score", { score }),
      action: t("cv.cta"),
    },
    {
      key: "documents",
      title: t("documents.title"),
      desc: t("documents.desc"),
      href: "/app/career/documents",
      icon: "doc",
      info: t("documents.count", { count: documents.length }),
      action: t("open"),
      lock: lockFor(documentsOpen, "career.documents"),
    },
    {
      key: "linkedin",
      title: t("linkedin.title"),
      desc: t("linkedin.desc"),
      href: "/app/career/linkedin",
      icon: "partager",
      info: linkedin ? t("linkedin.last", { date: linkedin.createdAt }) : t("linkedin.none"),
      action: t("open"),
      lock: lockFor(linkedinOpen, "career.linkedin"),
    },
    {
      key: "interviews",
      title: t("interviews.title"),
      desc: t("interviews.desc"),
      href: "/app/career/entretiens",
      icon: "mic",
      info:
        textQuota.limit > 0
          ? t("quota", { used: textQuota.used, quota: textQuota.limit })
          : t("stats.none"),
      action: t("interviews.cta"),
      lock: lockFor(textQuota.limit !== 0, "career.interview.text.monthly"),
    },
    {
      key: "plan",
      title: t("plan.title"),
      desc: t("plan.desc"),
      href: "/app/career/plan",
      icon: "calendrier",
      info: plan ? t("plan.steps", { done: stepsDone, total: stepsTotal }) : t("plan.none"),
      action: t("open"),
    },
    {
      key: "portfolio",
      title: t("portfolio.title"),
      desc: t("portfolio.desc"),
      href: "/app/career/portfolio",
      icon: "lien",
      info: t("portfolio.count", { count: projects.length }),
      action: t("open"),
      lock: lockFor(portfolio !== "none", PORTFOLIO_KEY),
    },
  ];
  const next = upcoming.find((interview) => interview.startsAt);

  return (
    <>
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <CareerTabs active="home" />

      <section
        aria-label={t("title")}
        className="relative grid gap-6 overflow-hidden rounded-[28px] bg-sapin p-6 text-blanc lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-[34px]"
      >
        <Pattern
          name="motif-trajectoires-sombre"
          size={300}
          opacity={0.5}
          className="[mask-image:linear-gradient(90deg,transparent_30%,#000)]"
        />
        <div className="relative flex flex-col items-start gap-3">
          {/* The banner above carries the eyebrow and the title. */}
          <p className="max-w-[540px] text-[20px] leading-snug font-semibold lg:text-[24px]">
            {t("subtitle")}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={primaryCv ? `/app/career/cv/${primaryCv.id}` : "/app/career/cv"}
              className={pillClass("lime")}
            >
              {t("cv.cta")}
              <Icon name="chev-r" className="size-4" />
            </Link>
            <Link
              href={
                lastDiagnostic
                  ? `/app/career/diagnostic?bilan=${lastDiagnostic.id}`
                  : "/app/career/diagnostic"
              }
              className={pillClass("ghost")}
            >
              {lastDiagnostic ? t("diagnostic.cta.view") : t("diagnostic.cta.start")}
            </Link>
          </div>
        </div>
        <ul className="relative grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="flex min-w-0 flex-col gap-1 rounded-[18px] bg-blanc/8 p-3.5 ring-1 ring-blanc/15 lg:w-[150px] lg:p-4"
            >
              <span className="text-xs text-blanc/75">{stat.label}</span>
              <span className="text-[26px] leading-none font-bold lg:text-[32px]">
                {stat.value}
              </span>
              <span className="text-xs text-neon">{stat.unit}</span>
            </li>
          ))}
        </ul>
      </section>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <li key={tool.key} className={cx(card, "flex min-w-0 flex-col gap-3")}>
            <div className="flex items-start justify-between gap-2">
              <IconTile icon={tool.icon} />
              {tool.lock && (
                <span className="flex items-center gap-1 rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold">
                  <Icon name="lock" className="size-3" />
                  {tool.lock}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold">
              <Link href={tool.href} className="underline-offset-4 hover:underline">
                {tool.title}
              </Link>
            </h2>
            <p className="text-[13px] leading-5 text-ardoise">{tool.desc}</p>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-brume pt-3">
              <span className="min-w-0 flex-1 text-xs font-semibold">{tool.info}</span>
              <Link
                href={tool.href}
                className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-up-texte hover:underline"
              >
                {tool.action}
                <Icon name="chev-r" className="size-3.5" />
              </Link>
            </div>
          </li>
        ))}
        <li className={cx(card, "flex min-w-0 flex-col gap-3")}>
          <div className="flex items-start justify-between gap-2">
            <IconTile icon="eye" />
            <span className="rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold">
              {t("later")}
            </span>
          </div>
          <h2 className="text-lg font-semibold">{t("tips.title")}</h2>
          <p className="text-[13px] leading-5 text-ardoise">{t("tips.desc")}</p>
        </li>
      </ul>

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
    </>
  );
}
