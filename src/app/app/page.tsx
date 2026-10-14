import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardText,
  CardTitle,
  EmptyState,
  ProgressRing,
  QuotaGauge,
  StatCard,
} from "@/components/ui";
import { RecommendedCourses, RecommendedJobs } from "@/components/matching/recommendations";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { parseLimit, resolvePlan, usage } from "@/server/entitlements";
import { billingSubject } from "@/server/services/accounts";
import { upcomingTalentInterviews } from "@/server/services/interviews";
import { isClosedStatus, listApplications, talentStatus } from "@/server/services/applications";
import { completeness, getFullProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";
import { getActiveSpace } from "@/server/hire-context";
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

/** Talent dashboard (partie 07 § 2): the next useful step, the journey, the applications. */
export default async function DashboardPage() {
  const t = await getTranslations();
  const user = await requireUser("/app");
  // A recruiter in their organization space lands on Hire; « Personnel » in the switcher comes back here.
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  const now = new Date();
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
  const [applications, cvCount, diagnosticCount, upcoming] = await Promise.all([
    listApplications(db, user.id),
    db.document.count({ where: { kind: "cv", profileId: profile.id } }),
    db.careerDiagnostic.count({ where: { userId: user.id } }),
    upcomingTalentInterviews(db, user.id, now),
  ]);
  const withStatus = applications.map((application) => ({
    ...application,
    status: talentStatus(application, now),
  }));
  const active = withStatus.filter((application) => !isClosedStatus(application.status));
  const interviews = withStatus.filter((application) => application.status === "interview").length;

  const sectionNames: Record<string, string> = {
    identity: t("talent.profile.identity.title"),
    summary: t("talent.profile.summary.title"),
    experience: t("talent.profile.experience.title"),
    education: t("talent.profile.education.title"),
    skills: t("talent.profile.skills.title"),
    languages: t("talent.profile.languages.title"),
    preferences: t("talent.profile.preferences.title"),
  };
  const nextStep =
    percent < 60
      ? { text: t("talent.dashboard.nextStep.completeProfile"), href: "/app/profil" }
      : cvCount === 0
        ? { text: t("talent.dashboard.nextStep.importCv"), href: "/app/career/cv" }
        : diagnosticCount === 0
          ? { text: t("talent.dashboard.nextStep.diagnostic"), href: "/app/career/diagnostic" }
          : percent < 100
            ? { text: t("talent.dashboard.nextStep.completeProfile"), href: "/app/profil" }
            : { text: t("talent.dashboard.applications.empty.text"), href: "/app/jobs" };

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
  const journey = [
    {
      key: "learn",
      href: "/formations",
      status: t("talent.dashboard.journey.learn.status", { count: 0 }),
    },
    {
      key: "profile",
      href: "/app/profil",
      status: t("talent.dashboard.journey.profile.status", { percent }),
    },
    {
      key: "apply",
      href: "/app/jobs",
      status: t("talent.dashboard.journey.apply.status", { count: applications.length }),
    },
    {
      key: "hired",
      href: "/app/jobs/candidatures",
      status: profile.desiredJobTitles[0]
        ? t("talent.dashboard.journey.hired.status", { goal: profile.desiredJobTitles[0] })
        : null,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-ardoise">{t("talent.dashboard.title")}</p>
        <h1 className="mt-1 text-h1">
          {applications.length === 0 && percent < 30
            ? t("talent.dashboard.greeting.first", { firstName })
            : t("talent.dashboard.greeting.neutral", { firstName })}
        </h1>
      </div>
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

      <Card tone="career" className="flex flex-wrap items-center gap-5">
        <ProgressRing value={percent} label={t("a11y.progress", { percent })} size={88} />
        <div className="flex flex-1 flex-col items-start gap-3">
          <p className="text-label">{t("talent.dashboard.nextStep.title")}</p>
          <CardText className="mt-0 font-semibold">{nextStep.text}</CardText>
          <ButtonLink href={nextStep.href} size="sm">
            {t("talent.dashboard.nextStep.cta")}
          </ButtonLink>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("talent.dashboard.kpi.applications.text")}
          value={String(applications.length)}
          hint={t("talent.dashboard.kpi.applications.hint", { count: interviews })}
        />
        <StatCard
          label={t("talent.dashboard.kpi.profileStrength.text")}
          value={t("talent.dashboard.kpi.profileStrength.value", { percent })}
          hint={
            missing[0]
              ? t("talent.dashboard.kpi.profileStrength.hint", {
                  action: sectionNames[missing[0]] ?? "",
                })
              : undefined
          }
        />
      </div>

      <section aria-labelledby="journey" className="flex flex-col gap-3">
        <div>
          <h2 id="journey" className="text-h2">
            {t("talent.dashboard.journey.title")}
          </h2>
          <p className="text-sm text-ardoise">{t("talent.dashboard.journey.subtitle")}</p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((step, index) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className="flex h-full flex-col gap-1 rounded-card bg-blanc p-5 hover:bg-menthe-claire"
              >
                <span className="text-ardoise text-caption">{index + 1}</span>
                <span className="font-semibold">
                  {t(`talent.dashboard.journey.${step.key}.text`)}
                </span>
                {step.status && <span className="text-sm text-ardoise">{step.status}</span>}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {profile.matchingEnabled && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RecommendedJobs userId={user.id} />
          <RecommendedCourses userId={user.id} />
        </div>
      )}

      {upcoming.length > 0 && (
        <section
          aria-labelledby="upcoming"
          className="flex flex-col gap-3 rounded-card bg-blanc p-6"
        >
          <h2 id="upcoming" className="text-h2">
            {t("talent.dashboard.upcoming.title")}
          </h2>
          <ul className="flex flex-col divide-y divide-brume">
            {upcoming.map((interview) => (
              <li key={interview.id} className="flex flex-col gap-1 py-3">
                <Link
                  href={
                    interview.application.conversation
                      ? `/app/messages/${interview.application.conversation.id}#entretien-${interview.id}`
                      : "/app/jobs/candidatures"
                  }
                  className="font-semibold underline"
                >
                  {t("talent.dashboard.upcoming.interview.text", {
                    company: interview.organization.name,
                  })}
                </Link>
                <span className="text-sm text-ardoise">
                  {t("talent.dashboard.upcoming.interview.detail", {
                    time: format.dateTime(interview.startsAt ?? now, {
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
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="applications"
          className="flex flex-col gap-3 rounded-card bg-blanc p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="applications" className="text-h2">
              {t("talent.dashboard.applications.title")}
            </h2>
            <Link href="/app/jobs/candidatures" className="text-sm underline">
              {t("talent.dashboard.applications.seeAll")}
            </Link>
          </div>
          {active.length === 0 ? (
            <EmptyState
              title={t("talent.dashboard.applications.empty.text")}
              action={
                <ButtonLink href="/app/jobs" size="sm">
                  {t("talent.dashboard.applications.empty.cta")}
                </ButtonLink>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-brume">
              {active.slice(0, 4).map((application) => (
                <li
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span className="flex flex-col">
                    <Link
                      href={`/app/jobs/${application.job.slug}`}
                      className="font-semibold underline"
                    >
                      {application.job.title}
                    </Link>
                    <span className="text-sm text-ardoise">
                      {application.job.organization.name}
                    </span>
                  </span>
                  <Badge tone="jobs">
                    {t(`talent.jobs.applications.status.${application.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="quotas" className="flex flex-col gap-3 rounded-card bg-blanc p-6">
          <h2 id="quotas" className="text-h2">
            {t("talent.dashboard.quotas.title")}
          </h2>
          {plan && (
            <p className="text-sm text-ardoise">
              {t("talent.dashboard.quotas.renewal", { date: plan.periodEnd })}
            </p>
          )}
          {gauges.map((gauge) =>
            gauge.max === 0 ? (
              <div key={gauge.key} className="flex justify-between gap-3 text-[15px]">
                <span className="font-medium">{t(`talent.dashboard.quotas.${gauge.label}`)}</span>
                <span className="text-ardoise text-label">
                  {t("talent.dashboard.quotas.notIncluded")}
                </span>
              </div>
            ) : (
              <QuotaGauge
                key={gauge.key}
                label={t(`talent.dashboard.quotas.${gauge.label}`)}
                used={gauge.used}
                limit={gauge.max < 0 ? null : gauge.max}
              />
            ),
          )}
          <p className="text-sm font-medium text-feuille-fonce">{t("talent.jobs.sidebar.free")}</p>
          <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
            {t("account.menu.subscription")}
          </ButtonLink>
        </section>
      </div>

      <Card>
        <CardTitle>{t("career.home.title")}</CardTitle>
        <CardText className="text-ardoise">{t("career.home.subtitle")}</CardText>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/app/career/cv" variant="secondary" size="sm">
            {t("career.home.cv.cta")}
          </ButtonLink>
          <ButtonLink href="/app/career/diagnostic" variant="secondary" size="sm">
            {t("career.home.diagnostic.title")}
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
