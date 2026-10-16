import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { DailyWelcome } from "@/components/app/daily-welcome";
import {
  CourseRow,
  ForMeCourseCard,
  ForMeRow,
  ForMeSection,
  RowList,
} from "@/components/app/for-me";
import { Icon, type IconName } from "@/components/brand/icon";
import { TalentJobCard } from "@/components/jobs/talent-kit";
import { Alert, ButtonLink, GoalCard, ProgressBar, VisualTile } from "@/components/ui";
import type { GoalStat } from "@/components/ui";
import { homeFocus } from "@/lib/welcome";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { billingSubject } from "@/server/services/accounts";
import { isClosedStatus, listApplications, talentStatus } from "@/server/services/applications";
import { lockedTools } from "@/server/services/career-offer";
import {
  forMeCourses,
  forMeJobs,
  nextActions,
  skillsToStrengthen,
  type NextAction,
} from "@/server/services/for-me";
import { jobCards } from "@/server/services/jobs";
import { myCertificates } from "@/server/services/learn";
import { nextLessons } from "@/server/services/learn-academy";
import { completeness, getFullProfile } from "@/server/services/profile";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.forMe");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/** Score from which an offer counts as « correspond à votre profil » (same as the dashboard). */
const THRESHOLD = 70;

const actionLook: Record<NextAction["kind"], { icon: IconName; tone: string }> = {
  interview: { icon: "calendrier", tone: "bg-lime" },
  document: { icon: "doc", tone: "bg-neon" },
  message: { icon: "message", tone: "bg-lime-clair" },
  course: { icon: "learn", tone: "bg-menthe-claire" },
  profile: { icon: "profil", tone: "bg-creme" },
};

/**
 * « Pour moi » (docs/ux-mobile-talent, prompt 3, screens 03-05): the home of the talent space,
 * ordered by the goal chosen on the welcome screen (`homeFocus`): offers first, courses first, or
 * the next position. Real figures and real offers only; without a goal, a general selection that
 * says so. The former dashboard stays at /app/tableau-de-bord.
 */
export default async function ForMePage() {
  const t = await getTranslations();
  const user = await requireUser("/app");
  // A recruiter in their organization space lands on Hire; « Personnel » in the switcher comes back here.
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const now = new Date();

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
  const { percent } = completeness(profile);
  const { focus, personalised } = homeFocus(profile.goal);
  const [plan, applications, lessons, certificates, finished, offers, courses, skills, saved] =
    await Promise.all([
      resolvePlan(db, { type: "user", id: user.id }, now),
      listApplications(db, user.id),
      nextLessons(db, user.id),
      myCertificates(db, user.id),
      db.enrollment.count({ where: { userId: user.id, completedAt: { not: null } } }),
      forMeJobs(db, user.id, 20, now),
      forMeCourses(
        db,
        user.id,
        { take: 6, ...(focus === "career" && { levels: ["intermediate", "advanced"] }) },
        now,
      ),
      focus === "career" ? skillsToStrengthen(db, user.id) : Promise.resolve([]),
      db.savedJob.findMany({
        where: { userId: user.id },
        select: { job: { select: { slug: true } } },
      }),
    ]);
  const current = lessons[0];
  const actions = await nextActions(
    db,
    user.id,
    // The skills home already shows the course to resume in its own card.
    { course: focus === "skills" ? null : current, percent },
    3,
    now,
  );

  const withStatus = applications.map((application) => talentStatus(application, now));
  const active = withStatus.filter((status) => !isClosedStatus(status)).length;
  const interviews = withStatus.filter((status) => status === "interview").length;
  const validCertificates = certificates.filter((certificate) => !certificate.revokedAt);
  const locked = plan ? lockedTools(plan.values) : [];
  const lockedLabel = (tool: (typeof locked)[number]) =>
    locked.includes(tool) ? t("talent.forMe.tools.locked") : undefined;

  // Offers: three on the job home, two elsewhere (screens 03-05).
  const shown = offers.jobs.slice(0, focus === "job" ? 3 : 2);
  const cards = await jobCards(
    db,
    shown.map((item) => item.jobId),
  );
  const explanations = new Map(shown.map((item) => [item.jobId, item.explanation]));
  const appliedSlugs = new Set(applications.map((application) => application.job.slug));
  const savedSlugs = new Set(saved.map((row) => row.job.slug));
  const strong = offers.personalised
    ? offers.jobs.filter((item) => (item.explanation?.score ?? 0) >= THRESHOLD).length
    : 0;

  // Message of the day: one real fact about the account (brief § 4.1), as on the dashboard.
  const welcome =
    strong > 0
      ? { sentence: t("talent.dashboard.welcome.matches", { count: strong }), href: "/app/jobs" }
      : current && current.remaining > 0
        ? {
            sentence: t("talent.dashboard.welcome.course", {
              courseTitle: current.title,
              count: current.remaining,
            }),
            href: `/app/learn/${current.slug}`,
          }
        : { sentence: t("talent.dashboard.welcome.profile", { percent }), href: "/app/profil" };

  // Goal card: three real figures; a count at zero is left out, the profile is always known.
  const profileStat: GoalStat = {
    value: t("talent.forMe.stats.percent", { percent }),
    label: t("talent.forMe.stats.profile"),
  };
  const counted = (
    count: number,
    key: "applications" | "interviews" | "courses" | "certificates" | "skills",
  ): GoalStat[] =>
    count > 0 ? [{ value: count, label: t(`talent.forMe.stats.${key}`, { count }) }] : [];
  const stats: GoalStat[] =
    focus === "skills"
      ? [
          ...counted(lessons.length, "courses"),
          ...counted(validCertificates.length, "certificates"),
          profileStat,
        ]
      : focus === "career"
        ? [...counted(skills.length, "skills"), ...counted(lessons.length, "courses"), profileStat]
        : [...counted(active, "applications"), ...counted(interviews, "interviews"), profileStat];

  const firstName = user.firstName ?? user.name;
  const jobsSection = (
    <ForMeSection id="pour-moi-offres" title={t(`talent.forMe.jobs.title.${focus}`)}>
      {!offers.personalised && (
        <p className="flex items-center gap-2 rounded-[16px] bg-lime-clair px-3.5 py-2.5 text-[13.5px]">
          <Icon name="info" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">{t("talent.forMe.jobs.general")}</span>
          <Link
            href="/app/bienvenue?etape=2"
            className="flex min-h-11 items-center font-semibold underline underline-offset-2"
          >
            {t("talent.forMe.jobs.complete")}
          </Link>
        </p>
      )}
      {cards.length === 0 ? (
        <p className="rounded-[20px] bg-blanc p-4 text-[14px] text-ardoise shadow-douce">
          {t("talent.forMe.jobs.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map((job) => {
            const explanation = explanations.get(job.id);
            return (
              <li key={job.id}>
                <TalentJobCard
                  job={job}
                  now={now}
                  match={explanation ? { state: "ok", explanation } : undefined}
                  applied={appliedSlugs.has(job.slug)}
                  saved={savedSlugs.has(job.slug)}
                  back="/app"
                />
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/app/jobs"
        className="jm-press flex min-h-12 items-center justify-center rounded-pill bg-blanc text-[15px] font-semibold shadow-douce"
      >
        {t("talent.forMe.jobs.all")}
      </Link>
    </ForMeSection>
  );

  const coursesSection = courses.length > 0 && (
    <ForMeSection
      id="pour-moi-formations"
      title={t(`talent.forMe.courses.title.${focus}`)}
      link={{ href: "/app/learn/explorer", label: t("talent.forMe.courses.explore") }}
    >
      <CourseRow>
        {courses.map((course, index) => (
          <ForMeCourseCard key={course.slug} course={course} index={index} />
        ))}
      </CourseRow>
    </ForMeSection>
  );

  const actionsSection = actions.length > 0 && (
    <ForMeSection id="pour-moi-actions" title={t(`talent.forMe.actions.title.${focus}`)}>
      <RowList>
        {actions.map((action, index) => {
          const look = actionLook[action.kind];
          const text =
            action.kind === "interview"
              ? {
                  title: t("talent.forMe.actions.interview"),
                  line: t("talent.forMe.actions.interviewLine", {
                    company: action.company,
                    date: action.at,
                  }),
                }
              : action.kind === "document"
                ? {
                    title: t("talent.forMe.actions.document"),
                    line: [action.company, action.name].filter(Boolean).join(" · "),
                  }
                : action.kind === "message"
                  ? {
                      title: t("talent.forMe.actions.message"),
                      line: action.company || t("talent.forMe.actions.messageLine"),
                    }
                  : action.kind === "course"
                    ? { title: t("talent.forMe.actions.course"), line: action.title }
                    : {
                        title: t("talent.forMe.actions.profile"),
                        line: t("talent.forMe.actions.profileLine", { percent: action.percent }),
                      };
          return (
            <ForMeRow
              key={`${action.kind}-${index}`}
              href={action.href}
              icon={look.icon}
              tone={look.tone}
              title={text.title}
              line={text.line}
            />
          );
        })}
      </RowList>
    </ForMeSection>
  );

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">
          {applications.length === 0 && lessons.length === 0 && percent < 30
            ? t("talent.dashboard.greeting.first", { firstName })
            : t("talent.dashboard.greeting.neutral", { firstName })}
        </h1>
        <DailyWelcome
          person={user.id}
          sentence={welcome.sentence}
          href={welcome.href}
          closeLabel={t("talent.dashboard.welcome.close")}
        />
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

      <GoalCard
        eyebrow={t("talent.forMe.goal.eyebrow")}
        title={personalised ? t(`welcome.talent.focus.${focus}.text`) : t("talent.forMe.goal.none")}
        stats={stats}
        editHref="/app/bienvenue"
        editLabel={personalised ? t("talent.forMe.goal.edit") : t("talent.forMe.goal.choose")}
      />

      {focus === "job" && (
        <>
          {jobsSection}
          {coursesSection}
          <ForMeSection id="pour-moi-outils" title={t("talent.forMe.tools.title")}>
            <div className="grid grid-cols-2 gap-3">
              <VisualTile
                href="/app/career/cv"
                title={t("talent.forMe.tools.cv")}
                line={t("talent.forMe.tools.cvLine")}
                scene="cv"
                tone="lime"
              />
              <VisualTile
                href="/app/profil"
                title={t("talent.forMe.tools.profile")}
                line={t("talent.forMe.tools.profileLine")}
                scene="profile"
                tone="neon"
                badge={t("talent.forMe.stats.percent", { percent })}
              />
              <VisualTile
                href="/app/career/entretiens"
                title={t("talent.forMe.tools.interview")}
                line={t("talent.forMe.tools.interviewLine")}
                scene="interview"
                tone="menthe"
                locked={lockedLabel("interviews")}
              />
              <VisualTile
                href="/app/career/documents"
                title={t("talent.forMe.tools.documents")}
                line={t("talent.forMe.tools.documentsLine")}
                scene="documents"
                tone="brume"
                locked={lockedLabel("documents")}
              />
            </div>
          </ForMeSection>
          {actionsSection}
        </>
      )}

      {focus === "skills" && (
        <>
          {current && (
            <section
              aria-labelledby="pour-moi-reprendre"
              className="flex flex-col gap-3 rounded-[24px] bg-sapin p-5 text-blanc shadow-douce"
            >
              <p className="text-[12px] font-semibold tracking-[0.08em] text-neon uppercase">
                {t("talent.forMe.resume.eyebrow")}
              </p>
              <h2 id="pour-moi-reprendre" className="text-[20px] leading-tight font-bold">
                {current.title}
              </h2>
              <p className="text-[13.5px] text-blanc/80">
                {current.next
                  ? t("talent.forMe.resume.lesson", { lesson: current.next.title })
                  : t("talent.forMe.resume.left", { count: current.remaining })}
              </p>
              <ProgressBar
                value={current.progress}
                tone="lime"
                onTint
                label={t("talent.forMe.courses.progress", { percent: current.progress })}
              />
              <Link
                href={
                  current.next
                    ? `/app/learn/${current.slug}?lecon=${current.next.id}`
                    : `/app/learn/${current.slug}`
                }
                className="jm-press flex min-h-12 items-center gap-2 self-start rounded-pill bg-lime px-6 text-[15px] font-semibold text-sapin"
              >
                <Icon name="play" className="size-4" />
                {t("talent.forMe.resume.cta")}
              </Link>
            </section>
          )}
          {coursesSection}
          {jobsSection}
          <ForMeSection
            id="pour-moi-progression"
            title={t("talent.forMe.progress.title")}
            link={{ href: "/app/learn/attestations", label: t("talent.forMe.progress.all") }}
          >
            <RowList>
              {validCertificates[0] && (
                <ForMeRow
                  href="/app/learn/attestations"
                  icon="certificat"
                  tone="bg-lime"
                  title={t("talent.forMe.progress.certificate", {
                    title: validCertificates[0].courseTitle,
                  })}
                  line={t("talent.forMe.progress.issued", { date: validCertificates[0].issuedAt })}
                />
              )}
              <ForMeRow
                href="/app/learn"
                icon="learn"
                tone="bg-creme"
                title={t("talent.forMe.progress.courses", {
                  inProgress: lessons.length,
                  done: finished,
                })}
                line={t("talent.forMe.progress.coursesLine")}
              />
            </RowList>
          </ForMeSection>
          {actionsSection}
        </>
      )}

      {focus === "career" && (
        <>
          {jobsSection}
          <ForMeSection id="pour-moi-positionner" title={t("talent.forMe.position.title")}>
            <RowList>
              <ForMeRow
                href="/app/career/diagnostic"
                icon="statistiques"
                tone="bg-lime"
                title={t("talent.forMe.position.diagnostic")}
                line={t("talent.forMe.position.diagnosticLine")}
              />
              <ForMeRow
                href="/app/career/linkedin"
                icon="lien"
                tone="bg-neon"
                title={t("talent.forMe.position.linkedin")}
                line={t("talent.forMe.position.linkedinLine")}
              />
              <ForMeRow
                href="/app/career/portfolio"
                icon="portefeuille"
                tone="bg-menthe-claire"
                title={t("talent.forMe.position.portfolio")}
                line={t("talent.forMe.position.portfolioLine")}
              />
            </RowList>
          </ForMeSection>
          {coursesSection}
          {skills.length > 0 && (
            <ForMeSection id="pour-moi-competences" title={t("talent.forMe.skills.title")}>
              <div className="flex flex-col gap-3 rounded-[22px] bg-blanc p-4 shadow-douce">
                <ul className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <li key={skill.id}>
                      <Link
                        href={`/app/learn/explorer?q=${encodeURIComponent(skill.name)}`}
                        aria-label={t("talent.forMe.skills.search", { name: skill.name })}
                        className="jm-press flex min-h-11 items-center gap-1.5 rounded-pill bg-lime-clair px-3.5 text-[14px] font-medium"
                      >
                        {skill.name}
                        <Icon name="plus" className="size-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-[14px] font-semibold text-feuille-fonce">
                    <Icon name="eye" className="size-4" />
                    {t("talent.forMe.skills.why")}
                  </summary>
                  <p className="text-[13.5px] text-ardoise">{t("talent.forMe.skills.whyText")}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-[13px]">
                    {skills.map((skill) => (
                      <li key={skill.id}>
                        {t("talent.forMe.skills.offers", { name: skill.name, count: skill.offers })}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </ForMeSection>
          )}
          {actionsSection}
        </>
      )}
    </div>
  );
}
