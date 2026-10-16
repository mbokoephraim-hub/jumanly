import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { DailyWelcome } from "@/components/app/daily-welcome";
import { Alert, ButtonLink, ProgressBar } from "@/components/ui";
import { criterionText } from "@/components/matching/talent-why";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { parseLimit, resolvePlan, usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { recommendedJobs } from "@/server/matching/service";
import { getPartnerSpace } from "@/server/partner-context";
import { billingSubject } from "@/server/services/accounts";
import {
  isClosedStatus,
  listApplications,
  talentStatus,
  type TalentApplicationStatus,
} from "@/server/services/applications";
import { upcomingTalentInterviews } from "@/server/services/interviews";
import { myEnrollments } from "@/server/services/learn";
import { completeness, getFullProfile } from "@/server/services/profile";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.dashboard");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/** Quotas shown on the dashboard: the ones a talent plan can include. */
const talentQuotas = [
  { key: "ai.credits.monthly", label: "aiCredits" },
  { key: "career.interview.text.monthly", label: "interviewText" },
  { key: "career.interview.voice.monthly", label: "interviewVoice" },
] as const;

/** Score from which a job counts as « correspond à votre profil » (same as the Jobs list). */
const THRESHOLD = 70;

/** Colours of the « Continuer à apprendre » cards, in turn (mockup 03-01). */
const courseTints = ["bg-lime", "bg-neon", "bg-menthe-claire"];

const statusTone: Partial<Record<TalentApplicationStatus, string>> = {
  interview: "bg-lime",
  offer: "bg-lime",
  test: "bg-neon",
  viewed: "bg-neon",
  shortlisted: "bg-menthe-claire",
};
const initialTone = ["bg-sapin text-lime", "bg-neon text-sapin", "bg-feuille-fonce text-blanc"];

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** Talent dashboard (partie 07 § 2, mockup 03-01): the next useful step, the journey, the work. */
export default async function DashboardPage() {
  const t = await getTranslations();
  const d = dynamic(t);
  const user = await requireUser("/app");
  // A recruiter in their organization space lands on Hire; « Personnel » in the switcher comes back here.
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const subject = { type: "user" as const, id: user.id };
  const plan = await resolvePlan(db, subject, now);
  // « Payer plus tard » at sign-up: remind the plan that was chosen (partie 06 § 6.2).
  const flow = await readSignupFlow();
  const chosen = flow.plan
    ? await db.plan.findUnique({
        where: { code: flow.plan },
        select: { name: true, code: true, priceCents: true, family: true },
      })
    : null;
  const payer = chosen?.priceCents ? await billingSubject(db, user.id, chosen.family) : null;
  const payerPlan = payer ? await resolvePlan(db, payer) : null;
  const showFinalize = chosen && payerPlan?.status === "free";

  const profile = await getFullProfile(db, user.id);
  const { percent, missing } = completeness(profile);
  const format = await getFormatter();
  const [applications, enrollments, upcoming, matches] = await Promise.all([
    listApplications(db, user.id),
    myEnrollments(db, user.id),
    upcomingTalentInterviews(db, user.id, now),
    profile.matchingEnabled ? recommendedJobs(db, user.id, 20) : Promise.resolve([]),
  ]);
  const withStatus = applications.map((application) => ({
    ...application,
    status: talentStatus(application, now),
  }));
  const active = withStatus.filter((application) => !isClosedStatus(application.status));
  const interviews = withStatus.filter((application) => application.status === "interview").length;
  const sentThisMonth = applications.filter((item) => item.createdAt >= monthStart).length;
  const hired = withStatus.some((application) => application.status === "hired");

  // Learning: courses in progress, their lessons, and the hours of lessons already done.
  const inProgress = enrollments.filter((enrollment) => !enrollment.completedAt);
  const courses = await db.course.findMany({
    where: { slug: { in: inProgress.slice(0, 3).map((enrollment) => enrollment.course.slug) } },
    select: {
      slug: true,
      modules: { select: { lessons: { select: { id: true, jobSpecific: true } } } },
    },
  });
  const doneLessonIds = enrollments.flatMap((enrollment) => enrollment.completedLessons);
  const learnedSeconds = doneLessonIds.length
    ? ((
        await db.lesson.aggregate({
          where: { id: { in: doneLessonIds } },
          _sum: { durationSec: true },
        })
      )._sum.durationSec ?? 0)
    : 0;
  const hours = Math.round((learnedSeconds / 3600) * 10) / 10;

  // Jobs that match the profile well, and why (the criteria they share with the profile).
  const strong = matches.filter((item) => item.explanation.score >= THRESHOLD);
  const matchJobs = await db.job.findMany({
    where: { id: { in: strong.slice(0, 3).map((item) => item.jobId) } },
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      organization: { select: { name: true } },
    },
  });
  const reasons = strong[0]
    ? strong[0].explanation.criteria
        .filter((criterion) => criterion.status === "met")
        .slice(0, 3)
        .map((criterion) => d(`match.criterion.${criterionText[criterion.key]}.text`))
    : [];

  const sectionNames: Record<string, string> = {
    identity: t("talent.profile.identity.title"),
    summary: t("talent.profile.summary.title"),
    experience: t("talent.profile.experience.title"),
    education: t("talent.profile.education.title"),
    skills: t("talent.profile.skills.title"),
    languages: t("talent.profile.languages.title"),
    preferences: t("talent.profile.preferences.title"),
  };

  // Next step, by rule: close interview > course in progress > matching jobs > profile.
  const nextInterview = upcoming[0];
  const nextStep = nextInterview
    ? {
        text: t("talent.dashboard.nextStep.interview", {
          company: nextInterview.organization.name,
          date: nextInterview.startsAt ?? now,
        }),
        hint: t("talent.dashboard.nextStep.hint.interview"),
        href: "/app/career/entretiens",
        icon: "calendrier" as IconName,
      }
    : inProgress[0]
      ? {
          text: t("talent.dashboard.nextStep.resumeCourse", {
            courseTitle: inProgress[0].course.title,
          }),
          hint: t("talent.dashboard.nextStep.hint.course"),
          href: `/app/learn/${inProgress[0].course.slug}`,
          icon: "learn" as IconName,
        }
      : strong.length > 0
        ? {
            text: t("talent.dashboard.nextStep.apply", { count: strong.length }),
            hint: t("talent.dashboard.nextStep.hint.apply"),
            href: "/app/jobs",
            icon: "jobs" as IconName,
          }
        : {
            text: t("talent.dashboard.nextStep.completeProfile"),
            hint: t("talent.dashboard.nextStep.hint.profile"),
            href: "/app/profil",
            icon: "profil" as IconName,
          };

  // Message of the day: one real fact about the account (brief § 4.1).
  const firstCourse = inProgress[0];
  const firstCourseLessons = firstCourse
    ? (courses
        .find((course) => course.slug === firstCourse.course.slug)
        ?.modules.flatMap((module) => module.lessons) ?? [])
    : [];
  const lessonsLeft = firstCourse
    ? firstCourseLessons.filter((lesson) => !firstCourse.completedLessons.includes(lesson.id))
        .length
    : 0;
  const welcome =
    strong.length > 0
      ? {
          sentence: t("talent.dashboard.welcome.matches", { count: strong.length }),
          href: "/app/jobs",
        }
      : firstCourse && lessonsLeft > 0
        ? {
            sentence: t("talent.dashboard.welcome.course", {
              courseTitle: firstCourse.course.title,
              count: lessonsLeft,
            }),
            href: `/app/learn/${firstCourse.course.slug}`,
          }
        : { sentence: t("talent.dashboard.welcome.profile", { percent }), href: "/app/profil" };

  const gauges = plan
    ? await Promise.all(
        talentQuotas
          .filter((row) => row.key in plan.values)
          .map(async (row) => ({
            ...row,
            max: parseLimit(plan.values[row.key]),
            used: (await usage(db, subject, row.key, now)).used,
          })),
      )
    : [];
  const firstName = user.firstName ?? user.name;

  const kpis: {
    label: string;
    value: string;
    delta?: string;
    hint?: string;
    icon: IconName;
    tile: string;
  }[] = [
    {
      label: t("talent.dashboard.kpi.courses.text"),
      value: String(inProgress.length),
      delta: (() => {
        const added = inProgress.filter((item) => item.startedAt >= monthStart).length;
        return added > 0 ? t("talent.dashboard.kpi.delta.up", { value: added }) : undefined;
      })(),
      hint: t("talent.dashboard.kpi.courses.hint", {
        count: inProgress.filter((item) => item.startedAt >= monthStart).length,
      }),
      icon: "learn",
      tile: "bg-lime-clair",
    },
    {
      label: t("talent.dashboard.kpi.hours.text"),
      value: t("talent.dashboard.kpi.hours.value", { hours }),
      icon: "horloge",
      tile: "bg-[#FBF6C9]",
    },
    {
      label: t("talent.dashboard.kpi.applications.text"),
      value: String(applications.length),
      delta:
        sentThisMonth > 0
          ? t("talent.dashboard.kpi.delta.up", { value: sentThisMonth })
          : undefined,
      hint: t("talent.dashboard.kpi.applications.hint", { count: interviews }),
      icon: "jobs",
      tile: "bg-menthe-claire",
    },
    {
      label: t("talent.dashboard.kpi.profileStrength.text"),
      value: t("talent.dashboard.kpi.profileStrength.value", { percent }),
      hint: missing[0]
        ? t("talent.dashboard.kpi.profileStrength.hint", {
            action: (sectionNames[missing[0]] ?? "").toLowerCase(),
          })
        : undefined,
      icon: "profil",
      tile: "bg-gris-clair",
    },
  ];

  const journey = [
    {
      key: "learn",
      href: "/app/learn",
      icon: "learn" as IconName,
      done: enrollments.some((item) => item.completedAt),
      status: t("talent.dashboard.journey.learn.status", { count: inProgress.length }),
    },
    {
      key: "profile",
      href: "/app/profil",
      icon: "cv" as IconName,
      done: percent >= 100,
      status: t("talent.dashboard.journey.profile.status", { percent }),
    },
    {
      key: "apply",
      href: "/app/jobs",
      icon: "jobs" as IconName,
      done: applications.length > 0,
      status: t("talent.dashboard.journey.apply.status", { count: applications.length }),
    },
    {
      key: "hired",
      href: "/app/jobs/candidatures",
      icon: "objectif" as IconName,
      done: hired,
      status: profile.desiredJobTitles[0]
        ? t("talent.dashboard.journey.hired.status", { goal: profile.desiredJobTitles[0] })
        : null,
    },
  ];
  const current = journey.findIndex((step) => !step.done);

  const card = "rounded-[24px] bg-blanc p-5 lg:p-6";
  const sectionTitle = "text-[20px] leading-tight font-bold tracking-tight lg:text-[22px]";

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        eyebrow={t("talent.dashboard.date", { date: now })}
        title={
          applications.length === 0 && enrollments.length === 0 && percent < 30
            ? t("talent.dashboard.greeting.first", { firstName })
            : t("talent.dashboard.greeting.neutral", { firstName })
        }
        subtitle={
          <DailyWelcome
            person={user.id}
            sentence={welcome.sentence}
            href={welcome.href}
            closeLabel={t("talent.dashboard.welcome.close")}
          />
        }
        actions={
          inProgress[0] ? (
            <HeaderAction
              href={`/app/learn/${inProgress[0].course.slug}`}
              icon="play"
              label={t("learn.catalog.resume", { percent: inProgress[0].progress })}
            />
          ) : null
        }
      />

      {showFinalize && (
        <Alert
          tone="warning"
          title={t("billing.finalize.text", { plan: chosen.name, freePlan: payerPlan.planName })}
          action={
            <ButtonLink href={`/app/abonnement/payer?forfait=${chosen.code}`} size="sm">
              {t("billing.finalize.cta")}
            </ButtonLink>
          }
        />
      )}

      <section
        aria-labelledby="next-step"
        className="relative flex flex-wrap items-center gap-4 overflow-hidden rounded-[22px] border border-sapin/8 bg-blanc px-4 py-4 text-sapin lg:flex-nowrap lg:gap-5 lg:px-5"
      >
        <span
          aria-hidden
          className="relative flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-lime text-sapin"
        >
          <Icon name={nextStep.icon} className="size-6" />
        </span>
        <div className="relative flex min-w-0 flex-1 basis-56 flex-col gap-1">
          <p id="next-step" className="text-xs font-medium text-ardoise">
            {t("talent.dashboard.nextStep.title")}
          </p>
          <p className="text-[15px] leading-[21px] font-semibold">{nextStep.text}</p>
          <p className="text-[13px] text-ardoise max-lg:hidden">{nextStep.hint}</p>
        </div>
        <Link
          href={nextStep.href}
          className="relative flex h-10 items-center gap-2 rounded-pill bg-sapin px-5 text-[14px] font-semibold text-blanc transition-transform hover:-translate-y-0.5"
        >
          {t("talent.dashboard.nextStep.cta")}
          <Icon name="chev-r" className="size-4" />
        </Link>
      </section>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => (
          <li key={kpi.label} className="flex flex-col rounded-[20px] bg-blanc p-4 lg:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-ardoise lg:text-[13px]">{kpi.label}</p>
              <span
                aria-hidden
                className={cx(
                  "flex size-9 shrink-0 items-center justify-center rounded-full lg:size-[42px]",
                  kpi.tile,
                )}
              >
                <Icon name={kpi.icon} className="size-[18px]" />
              </span>
            </div>
            <p className="mt-1 text-[24px] leading-tight font-bold tracking-tight lg:mt-1.5 lg:text-[32px]">
              {kpi.value}
            </p>
            {(kpi.delta || kpi.hint) && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ardoise lg:text-xs">
                {kpi.delta && (
                  <span className="flex items-center gap-1 rounded-pill bg-lime-clair px-2 py-0.5 font-semibold text-up-texte">
                    {kpi.delta}
                    <Icon name="up" className="size-3" />
                  </span>
                )}
                {kpi.hint}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="journey" className={cx(card, "flex flex-col gap-6")}>
          <div>
            <h2 id="journey" className={sectionTitle}>
              {t("talent.dashboard.journey.title")}
            </h2>
            <p className="mt-1 text-[13px] text-ardoise">
              {t("talent.dashboard.journey.subtitle")}
            </p>
          </div>
          {/* Vertical next to the AI card on a wide screen, so the card has no large blank. */}
          <ol className="grid gap-4 sm:grid-cols-4 sm:gap-0 xl:grid-cols-1 xl:gap-5">
            {journey.map((step, index) => {
              const isCurrent = index === current;
              return (
                <li
                  key={step.key}
                  className={cx(
                    "relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2.5 xl:flex-row xl:items-center xl:gap-3",
                    index < journey.length - 1 &&
                      "sm:after:absolute sm:after:top-[21px] sm:after:right-0 sm:after:left-[44px] sm:after:h-[3px] sm:after:rounded-pill xl:after:top-[44px] xl:after:right-auto xl:after:left-[20.5px] xl:after:h-5 xl:after:w-[3px]",
                    index < journey.length - 1 &&
                      (step.done ? "sm:after:bg-lime" : "sm:after:bg-brume"),
                  )}
                >
                  <Link
                    href={step.href}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cx(
                      "relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-full",
                      step.done && "bg-lime text-sapin",
                      isCurrent && "bg-sapin text-lime shadow-[0_0_0_5px_rgb(166_242_107/0.45)]",
                      !step.done &&
                        !isCurrent &&
                        "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset",
                    )}
                  >
                    <Icon name={step.done ? "check" : step.icon} className="size-[18px]" />
                    <span className="sr-only">
                      {d(`talent.dashboard.journey.${step.key}.text`)}
                    </span>
                  </Link>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-semibold">
                      {d(`talent.dashboard.journey.${step.key}.text`)}
                    </span>
                    {step.status && <span className="text-[11px] text-ardoise">{step.status}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          {journey[current] && (
            <Link
              href={journey[current].href}
              className="mt-auto flex items-center gap-3 rounded-[18px] bg-creme px-4 py-3 text-[14px] hover:bg-lime-clair"
            >
              <Icon name={journey[current].icon} className="size-[18px] shrink-0" />
              <span className="min-w-0 flex-1">
                {t("talent.dashboard.journey.next", {
                  step: d(`talent.dashboard.journey.${journey[current].key}.text`),
                })}
              </span>
              <span className="flex shrink-0 items-center gap-1 font-semibold">
                {t("talent.dashboard.journey.go")}
                <Icon name="chev-r" className="size-4" />
              </span>
            </Link>
          )}
        </section>

        {profile.matchingEnabled && (
          <section
            aria-labelledby="ai-matches"
            className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-[linear-gradient(150deg,#14745f_0%,#0f3f37_70%)] p-5 text-blanc lg:p-6"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 -right-10 size-[160px] rounded-full ring-1 ring-blanc/15"
            />
            <p
              id="ai-matches"
              className="flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-neon uppercase"
            >
              <span
                aria-hidden
                className="size-7 rounded-full bg-[radial-gradient(circle_at_35%_35%,#E3F67C,#A6F26B_55%,#4caf50)]"
              />
              {t("talent.dashboard.ai.title")}
            </p>
            <p
              className={cx(
                "font-bold tracking-tight",
                strong.length > 0
                  ? "text-xl leading-[26px] lg:text-[22px] lg:leading-7"
                  : "text-base leading-[23px]",
              )}
            >
              {strong.length > 0
                ? t("talent.dashboard.ai.matches.text", {
                    count: strong.length,
                    threshold: THRESHOLD,
                  })
                : t("talent.dashboard.ai.matches.none")}
            </p>
            {strong.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-[18px] bg-sapin/55 p-2">
                {strong.slice(0, 3).map(({ jobId, explanation }, index) => {
                  const job = matchJobs.find((item) => item.id === jobId);
                  if (!job) return null;
                  return (
                    <li key={jobId}>
                      <Link
                        href={`/app/jobs/${job.slug}#compatibilite`}
                        className="flex items-center gap-3 rounded-[14px] px-2 py-1.5 hover:bg-blanc/10"
                      >
                        <span
                          aria-hidden
                          className={cx(
                            "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-bold",
                            initialTone[index % initialTone.length],
                          )}
                        >
                          {initials(job.organization.name)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[13px] font-semibold">{job.title}</span>
                          <span className="truncate text-[11px] text-blanc/65">
                            {job.organization.name}
                            {job.city && " · "}
                            {job.city}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 rounded-pill bg-sapin px-2 py-1 text-[11px] font-semibold text-lime">
                          <Icon name="intelligence" className="size-3" />
                          {t("talent.dashboard.ai.score", { score: explanation.score })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {reasons.length > 0 && (
              <p className="flex items-start gap-2 text-xs leading-[18px] text-blanc/80">
                <Icon name="eye" className="mt-0.5 size-3.5 shrink-0 text-lime" />
                <span>
                  <strong className="font-semibold text-blanc">
                    {t("talent.dashboard.ai.why")}
                  </strong>{" "}
                  {t("talent.dashboard.ai.reason", { criteria: format.list(reasons) })}
                </span>
              </p>
            )}
            <div className="mt-auto flex gap-2.5">
              <Link
                href="/app/jobs"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-pill bg-lime text-sm font-semibold text-sapin"
              >
                {t("talent.dashboard.ai.cta")}
                <Icon name="chev-r" className="size-4" />
              </Link>
            </div>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="continue" className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="continue" className={sectionTitle}>
              {t("talent.dashboard.continue.title")}
            </h2>
            <Link
              href="/app/learn/parcours"
              className="jm-tap text-[13px] font-semibold text-feuille-fonce"
            >
              {t("talent.dashboard.continue.seeAll")}
            </Link>
          </div>
          {inProgress.length === 0 ? (
            <div className={cx(card, "flex flex-wrap items-center justify-between gap-3")}>
              <p className="text-sm text-ardoise">{t("talent.dashboard.continue.empty.text")}</p>
              <ButtonLink href="/app/learn" size="sm">
                {t("talent.dashboard.continue.empty.cta")}
              </ButtonLink>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {inProgress.slice(0, 3).map((enrollment, index) => {
                const course = courses.find((item) => item.slug === enrollment.course.slug);
                const total = course
                  ? course.modules
                      .flatMap((module) => module.lessons)
                      .filter((lesson) => !lesson.jobSpecific).length
                  : 0;
                const done = Math.min(enrollment.completedLessons.length, total);
                return (
                  <li
                    key={enrollment.id}
                    className={cx(
                      "flex flex-col gap-3 rounded-[24px] p-5",
                      courseTints[index % courseTints.length],
                    )}
                  >
                    {enrollment.course.category && (
                      <span className="self-start rounded-pill bg-sapin px-2.5 py-1 text-[11px] font-semibold text-blanc">
                        {enrollment.course.category}
                      </span>
                    )}
                    <h3 className="text-[17px] leading-[23px] font-bold">
                      {enrollment.course.title}
                    </h3>
                    <div className="mt-auto flex flex-col gap-2">
                      <p className="flex justify-between text-xs">
                        {t("talent.dashboard.continue.progress")}
                        <span className="font-semibold">
                          {t("talent.dashboard.continue.lessons", { done, total })}
                        </span>
                      </p>
                      <ProgressBar
                        value={enrollment.progress}
                        tone="sapin"
                        onTint
                        label={t("a11y.progress", { percent: enrollment.progress })}
                      />
                    </div>
                    <Link
                      href={`/app/learn/${enrollment.course.slug}`}
                      className="flex h-9 items-center gap-1.5 self-end rounded-pill bg-sapin px-4 text-[13px] font-semibold text-blanc"
                    >
                      {t("talent.dashboard.continue.resume")}
                      <Icon name="chev-r" className="size-3.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="upcoming" className={cx(card, "flex flex-col gap-2")}>
          <div className="flex items-center justify-between">
            <h2 id="upcoming" className={sectionTitle}>
              {t("talent.dashboard.upcoming.title")}
            </h2>
            <Icon name="calendrier" className="size-5" />
          </div>
          {upcoming.length === 0 ? (
            <p className="py-3 text-sm text-ardoise">{t("talent.dashboard.upcoming.empty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-brume">
              {upcoming.map((interview, index) => {
                const startsAt = interview.startsAt ?? now;
                return (
                  <li key={interview.id} className="flex items-center gap-3 py-3">
                    <span
                      aria-hidden
                      className={cx(
                        "flex size-[46px] shrink-0 flex-col items-center justify-center rounded-[14px] leading-none",
                        index === 0 ? "bg-lime-clair" : "bg-gris-clair",
                      )}
                    >
                      <span className="text-[11px]">
                        {format.dateTime(startsAt, {
                          weekday: "short",
                          timeZone: interview.timezone,
                        })}
                      </span>
                      <span className="text-lg font-bold">
                        {format.dateTime(startsAt, {
                          day: "numeric",
                          timeZone: interview.timezone,
                        })}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <Link
                        href={
                          interview.application.conversation
                            ? `/app/messages/${interview.application.conversation.id}#entretien-${interview.id}`
                            : "/app/jobs/candidatures"
                        }
                        className="text-sm font-semibold hover:underline"
                      >
                        {t("talent.dashboard.upcoming.interview.text", {
                          company: interview.organization.name,
                        })}
                      </Link>
                      <span className="text-xs text-ardoise">
                        {t("talent.dashboard.upcoming.interview.detail", {
                          time: format.dateTime(startsAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: interview.timezone,
                          }),
                          mode: t(
                            `connect.invite.mode.${interview.mode === "audio" ? "call" : interview.mode}`,
                          ),
                          interviewer: interview.organizer?.name ?? interview.organization.name,
                        })}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="applications" className={cx(card, "flex flex-col gap-2")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="applications" className={sectionTitle}>
              {t("talent.dashboard.applications.title")}
            </h2>
            <Link
              href="/app/jobs/candidatures"
              className="jm-tap flex items-center gap-1 text-[13px] font-semibold text-feuille-fonce"
            >
              {t("talent.dashboard.applications.seeAll")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          {active.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <p className="text-sm text-ardoise">
                {t("talent.dashboard.applications.empty.text")}
              </p>
              <ButtonLink href="/app/jobs" size="sm">
                {t("talent.dashboard.applications.empty.cta")}
              </ButtonLink>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-brume">
              {active.slice(0, 4).map((application, index) => (
                <li key={application.id}>
                  <Link
                    href={`/app/jobs/${application.job.slug}`}
                    className="flex items-center gap-3 py-3 hover:bg-creme/40"
                  >
                    <span
                      aria-hidden
                      className={cx(
                        "flex size-10 shrink-0 items-center justify-center rounded-[12px] text-sm font-bold",
                        initialTone[index % initialTone.length],
                      )}
                    >
                      {initials(application.job.organization.name)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {application.job.title}
                      </span>
                      <span className="truncate text-xs text-ardoise">
                        {application.job.organization.name}
                        {" · "}
                        {t("talent.jobs.applications.sentOn", { date: application.createdAt })}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold max-sm:hidden",
                        statusTone[application.status] ?? "bg-gris-clair",
                      )}
                    >
                      {t(`talent.jobs.applications.status.${application.status}`)}
                    </span>
                    <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="quotas" className={cx(card, "flex flex-col gap-4")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="quotas" className={sectionTitle}>
                {t("talent.dashboard.quotas.title")}
              </h2>
              {plan?.periodEnd && (
                <p className="mt-1 text-xs text-ardoise">
                  {t("talent.dashboard.quotas.renewal", { date: plan.periodEnd })}
                </p>
              )}
            </div>
            {plan && (
              <span className="rounded-pill bg-sapin px-2.5 py-1 text-[11px] font-semibold text-lime">
                {plan.planName}
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-4">
            {gauges.map((gauge) => {
              const label = t(`talent.dashboard.quotas.${gauge.label}`);
              const ratio = gauge.max > 0 ? (gauge.used / gauge.max) * 100 : 0;
              return (
                <li key={gauge.key} className="flex flex-col gap-2">
                  <p className="flex justify-between gap-3 text-[13px]">
                    {label}
                    <span className="font-semibold">
                      {gauge.max === 0
                        ? t("talent.dashboard.quotas.notIncluded")
                        : gauge.max < 0
                          ? t("talent.dashboard.quotas.unlimited")
                          : t("talent.dashboard.quotas.usage", {
                              used: gauge.used,
                              quota: gauge.max,
                            })}
                    </span>
                  </p>
                  {gauge.max > 0 && (
                    <ProgressBar
                      value={ratio}
                      label={label}
                      tone={ratio >= 80 ? "warning" : "sapin"}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-ardoise">
              <Icon name="check" className="size-3.5 text-feuille-fonce" />
              {t("talent.jobs.sidebar.free")}
            </span>
            <Link href="/app/abonnement" className="font-semibold text-feuille-fonce">
              {t("talent.dashboard.quotas.seePlans")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
