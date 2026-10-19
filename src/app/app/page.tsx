import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { WelcomeCard } from "@/components/access/welcome-card";
import { CourseArt, Logo, toneOf, Banner } from "@/components/talent/art";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { homeFocus } from "@/lib/welcome";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { billingSubject } from "@/server/services/accounts";
import { forMeCourses, forMeJobs, nextActions, type NextAction } from "@/server/services/for-me";
import { jobCards } from "@/server/services/jobs";
import { nextLessons } from "@/server/services/learn-academy";
import { completeness, getFullProfile } from "@/server/services/profile";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forMe");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const nextTitle: Record<NextAction["kind"], string> = {
  interview: "interview",
  document: "document",
  draft: "draft",
  message: "message",
  course: "course",
  profile: "profile",
};

/**
 * « Pour moi » (planche talent-1 § 1): the goal chosen at the first connection, one next step,
 * then the essentials. « Trouver un emploi »: the step, three offers, the course in progress and
 * the quick access. « Développer mes compétences »: the courses come first, the offers after.
 * Real figures and real offers only; without a score, a general selection that says so.
 */
export default async function ForMePage({ searchParams }: PageProps<"/app">) {
  const t = await getTranslations();
  const d = dynamic(t);
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
  const skillsHome = focus === "skills";
  const [plan, lessons, offers, courses, cvs] = await Promise.all([
    resolvePlan(db, { type: "user", id: user.id }, now),
    nextLessons(db, user.id),
    forMeJobs(db, user.id, 3, now),
    skillsHome ? forMeCourses(db, user.id, { take: 6 }, now) : Promise.resolve([]),
    db.document.count({ where: { profile: { userId: user.id }, kind: "cv" } }),
  ]);
  const current = lessons[0];
  const [step] = await nextActions(db, user.id, { course: current, percent }, 1, now);
  const cards = await jobCards(
    db,
    offers.jobs.map((item) => item.jobId),
  );
  const scores = new Map(
    offers.jobs.map((item) => [
      item.jobId,
      item.explanation ? Math.round(item.explanation.score) : null,
    ]),
  );

  // « Bienvenue sur Jumanly » (lot 2): a new account, until its first steps are done.
  const justCreated = (await searchParams).bienvenue === "1";
  const showWelcome =
    justCreated ||
    (now.getTime() - user.createdAt.getTime() < 14 * DAY_MS && (percent < 80 || cvs === 0));

  const categoryOf = (category: string) =>
    t.has(`forMe.category.${category}` as never) ? d(`forMe.category.${category}`) : category;
  const duration = (minutes: number) =>
    minutes >= 60
      ? t("forMe.learn.hours", { count: Math.round(minutes / 6) / 10 })
      : t("forMe.learn.minutes", { count: minutes });
  const lessonLine = (lesson: NonNullable<typeof current>) =>
    [
      lesson.next
        ? t("forMe.learn.module", { current: lesson.next.module, total: lesson.modules })
        : null,
      lesson.remaining > 0
        ? t("forMe.learn.left", { count: lesson.remaining })
        : t("forMe.learn.done"),
    ]
      .filter(Boolean)
      .join(" · ");
  const lessonHref = (lesson: NonNullable<typeof current>) =>
    lesson.next ? `/app/learn/${lesson.slug}?lecon=${lesson.next.id}` : `/app/learn/${lesson.slug}`;

  const goal = (
    <div className="t-obj">
      <TalentIcon name="cap" size="xs" />
      <span className="whitespace-nowrap">{t("forMe.goal.label")}</span>
      <b className="min-w-0">
        {personalised && profile.goal
          ? d(`welcome.talent.goal.${profile.goal}`)
          : t("forMe.goal.none")}
      </b>
      <Link
        href="/app/bienvenue?etape=objectif&seul=1"
        aria-label={t("forMe.goal.editAria")}
        className="t-press"
      >
        {t("forMe.goal.edit")}
      </Link>
    </div>
  );

  const nextStep = (
    <section aria-labelledby="pm-etape" className="t-verre t-carte t-etape t-compacte">
      <div className="t-corps">
        <span
          className="t-anneau"
          role="img"
          aria-label={t("forMe.next.ring", { percent })}
          style={{ "--p": percent } as React.CSSProperties}
        >
          <b aria-hidden>{t("forMe.offers.score", { score: percent })}</b>
        </span>
        <div className="min-w-0 flex-1">
          <span className="t-k">
            <i aria-hidden />
            {t("forMe.next.eyebrow")}
          </span>
          <h2 id="pm-etape" className="text-[15.5px] leading-tight font-semibold">
            {step ? d(`forMe.next.${nextTitle[step.kind]}`) : t("forMe.next.done")}
          </h2>
        </div>
        <Link
          href={step?.href ?? "/app/jobs"}
          aria-label={t("forMe.next.go")}
          className="t-bt t-p t-s t-press"
        >
          <TalentIcon name="suivant" size="xs" />
        </Link>
      </div>
    </section>
  );

  const offersGroup =
    cards.length === 0 ? (
      <p className="t-verre t-vide">
        <span>{t("forMe.offers.empty")}</span>
      </p>
    ) : (
      <section aria-labelledby="pm-offres" className="t-verre t-grp">
        <div className="t-ban-g">
          <Banner tone="oppo" />
          <h2 id="pm-offres" className="contents">
            <b style={{ color: "#0F3F37" }}>
              {offers.personalised
                ? t("forMe.offers.title", { count: cards.length })
                : t("forMe.offers.general", { count: cards.length })}
            </b>
          </h2>
          <Link href="/app/jobs" className="t-press">
            <small>{t("forMe.offers.all")}</small>
          </Link>
        </div>
        {cards.map((job) => {
          const score = scores.get(job.id) ?? null;
          const tone = toneOf(job.organization.name);
          return (
            <div key={job.id} className="t-ln">
              <Logo name={job.organization.name} src={job.organization.logo} tone={tone} />
              <div className="t-t">
                <Link href={`/app/jobs/${job.slug}`} className="t-lien">
                  <b>{job.title}</b>
                </Link>
                <span>
                  {t("forMe.offers.line", { company: job.organization.name, city: job.city })}
                </span>
              </div>
              {score !== null && (
                <Link
                  href={`/app/jobs/${job.slug}?pourquoi=1`}
                  aria-label={t("offers.card.why", { score })}
                  className="t-score t-press relative z-[1]"
                >
                  {t("forMe.offers.score", { score })}
                </Link>
              )}
            </div>
          );
        })}
      </section>
    );

  const generalLine = !offers.personalised && cards.length > 0 && (
    <p className="t-res-l">
      {t("offers.line.general")}{" "}
      <Link href="/app/profil#competences">{t("offers.line.generalCta")}</Link>
    </p>
  );

  const quick: [string, TalentIconName, string, string][] = [
    ["/app/career/cv", "cv", "t-c2", t("forMe.quick.cv")],
    ["/app/jobs?vue=enregistrees", "favori", "t-c3", t("forMe.quick.saved")],
    ["/app/learn/attestations", "certificat", "t-c1", t("forMe.quick.certificates")],
    ["/app/profil", "profil", "", t("forMe.quick.profile")],
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="sr-only">{t("forMe.title")}</h1>
      {showWelcome && (
        <WelcomeCard
          percent={percent}
          hasCv={cvs > 0}
          offers={offers.jobs.length}
          place={user.city ?? null}
          toastPlan={justCreated ? (plan?.planName ?? undefined) : undefined}
        />
      )}
      {showFinalize && (
        <div className="t-verre t-bandeau">
          <span className="t-ic-r" aria-hidden>
            <TalentIcon name="portefeuille" size="s" />
          </span>
          <div className="t-t flex-1">
            <b>{t("billing.finalize.text", { plan: chosen.name, freePlan: payerPlan.planName })}</b>
          </div>
          <Link
            href={`/app/abonnement/payer?forfait=${chosen.code}`}
            className="t-bt t-p t-s t-press"
          >
            {t("billing.finalize.cta")}
          </Link>
        </div>
      )}
      {goal}

      {skillsHome ? (
        <>
          {current && (
            <article className="t-verre t-fo">
              <div className="t-ban">
                <CourseArt category={current.category} />
                <span className="t-tg">{t("forMe.learn.resume")}</span>
                <span className="t-dur">
                  {t("forMe.learn.progress", { percent: current.progress })}
                </span>
              </div>
              <div className="t-t">
                <Link
                  href={lessonHref(current)}
                  aria-label={t("forMe.learn.resumeAria", { title: current.title })}
                  className="t-lien"
                >
                  <b>{current.title}</b>
                </Link>
                <span>{[lessonLine(current), categoryOf(current.category)].join(" · ")}</span>
                <span className="t-barre" aria-hidden>
                  <i style={{ width: `${current.progress}%` }} />
                </span>
              </div>
            </article>
          )}
          {courses.length > 0 && (
            <section aria-labelledby="pm-objectifs" className="flex flex-col gap-3.5">
              <div className="t-sec-t">
                <h2 id="pm-objectifs">{t("forMe.learn.goals")}</h2>
                <Link href="/app/learn/explorer">{t("forMe.learn.all")}</Link>
              </div>
              <ul className="t-defile t-glisse">
                {courses
                  .filter((course) => course.slug !== current?.slug)
                  .map((course) => (
                    <li key={course.slug} className="t-verre t-fo t-mini">
                      <div className="t-ban">
                        <CourseArt category={course.category} src={course.coverUrl} />
                        <span className="t-tg">{categoryOf(course.category)}</span>
                        <span className="t-dur">{duration(course.durationMinutes)}</span>
                      </div>
                      <div className="t-t">
                        <Link href={`/app/learn/${course.slug}`} className="t-lien">
                          <b>{course.title}</b>
                        </Link>
                        <span>{t("forMe.learn.modules", { count: course.modules })}</span>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          {offersGroup}
          {generalLine}
        </>
      ) : (
        <>
          {nextStep}
          {offersGroup}
          {generalLine}
          {current && (
            <section aria-labelledby="pm-apprendre" className="flex flex-col gap-3.5">
              <div className="t-sec-t">
                <h2 id="pm-apprendre">{t("forMe.learn.title")}</h2>
                <Link href="/app/learn">{t("forMe.learn.link")}</Link>
              </div>
              <article className="t-verre t-cont">
                <span className="t-vign">
                  <CourseArt category={current.category} />
                </span>
                <div className="t-t">
                  <b>{current.title}</b>
                  <span>{lessonLine(current)}</span>
                  <span className="t-barre mt-1.5" aria-hidden>
                    <i style={{ width: `${current.progress}%` }} />
                  </span>
                </div>
                <Link
                  href={lessonHref(current)}
                  aria-label={t("forMe.learn.resumeAria", { title: current.title })}
                  className="t-bt t-p t-s t-press"
                >
                  <TalentIcon name="suivant" size="xs" />
                </Link>
              </article>
            </section>
          )}
          <section aria-labelledby="pm-acces" className="flex flex-col gap-3.5">
            <div className="t-sec-t">
              <h2 id="pm-acces">{t("forMe.quick.title")}</h2>
            </div>
            <nav aria-labelledby="pm-acces" className="t-verre t-raccs">
              {quick.map(([href, icon, tone, label]) => (
                <Link key={href} href={href} className="t-press">
                  <span className={`t-cases ${tone}`} aria-hidden>
                    <TalentIcon name={icon} size="s" />
                  </span>
                  {label}
                </Link>
              ))}
            </nav>
          </section>
        </>
      )}
    </div>
  );
}
