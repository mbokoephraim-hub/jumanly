import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon, type IconName } from "@/components/brand/icon";
import { RecommendedCourses } from "@/components/matching/recommendations";
import { ButtonLink, ProgressBar, ProgressRing } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { learnerEvaluations, nextLessons } from "@/server/services/learn-academy";
import { myCertificates, myEnrollments } from "@/server/services/learn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.home");
  return { title: t("seo"), robots: { index: false } };
}

/** Old catalog addresses (`?q=`, `?liste=`…) keep working: they lead to the new spaces. */
const catalogParams = ["q", "theme", "niveau", "acces", "page", "enregistre"];
const legacyLists: Record<string, string> = {
  toutes: "",
  mes: "",
  terminees: "?liste=terminees",
  enregistrees: "?liste=enregistrees",
};

const card = "rounded-[22px] border border-sapin/8 bg-blanc p-5 lg:p-6";
const sectionTitle = "text-[18px] leading-tight font-bold tracking-tight lg:text-[20px]";

/**
 * « Mon espace d'apprentissage », the home of the Learn academy (ux-test, étape 2): the next lesson
 * in one click, what is left to do, the AI coach, the latest attestation and the recommendations.
 */
export default async function LearnHomePage({ searchParams }: PageProps<"/app/learn">) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (typeof value === "string") query.set(key, value);
  if (typeof params.liste === "string" && params.liste in legacyLists)
    redirect(
      params.liste === "toutes"
        ? "/app/learn/explorer"
        : `/app/learn/parcours${legacyLists[params.liste]}`,
    );
  if (catalogParams.some((key) => query.has(key))) redirect(`/app/learn/explorer?${query}`);

  const user = await requireUser("/app/learn");
  const t = await getTranslations();
  const format = await getFormatter();
  const [courses, enrollments, evaluations, certificates, profile] = await Promise.all([
    nextLessons(db, user.id),
    myEnrollments(db, user.id),
    learnerEvaluations(db, user.id),
    myCertificates(db, user.id),
    db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { desiredJobTitles: true },
    }),
  ]);
  const current = courses[0];
  const others = courses.slice(1, 4);
  const lessonsDone = enrollments.reduce((sum, row) => sum + row.completedLessons.length, 0);
  const passed = evaluations.filter((item) => item.status === "passed").length;
  const valid = certificates.filter((certificate) => !certificate.revokedAt);
  const todo = [
    ...evaluations.filter((item) => item.status === "review"),
    ...evaluations.filter((item) => item.status === "todo"),
  ].slice(0, 3);
  const lessonHref = (slug: string, id?: string) =>
    id ? `/app/learn/${slug}?lecon=${id}` : `/app/learn/${slug}`;

  const stats: { label: string; value: number; icon: IconName; tone: string }[] = [
    {
      label: t("learn.home.stats.inProgress"),
      value: courses.length,
      icon: "learn",
      tone: "bg-lime",
    },
    {
      label: t("learn.home.stats.lessons"),
      value: lessonsDone,
      icon: "cours-video",
      tone: "bg-menthe-claire",
    },
    {
      label: t("learn.home.stats.passed"),
      value: passed,
      icon: "quiz",
      tone: "bg-lime-clair",
    },
    {
      label: t("learn.home.stats.certificates"),
      value: valid.length,
      icon: "certificat",
      tone: "bg-neon",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        eyebrow={t("learn.home.eyebrow")}
        title={t("learn.home.title", { firstName: user.firstName ?? user.name })}
        actions={
          current ? (
            <HeaderAction
              href={lessonHref(current.slug, current.next?.id)}
              icon="play"
              label={t("learn.catalog.resume", { percent: current.progress })}
            />
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {current ? (
          <section
            aria-labelledby="learn-next"
            className={cx(card, "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6")}
          >
            <ProgressRing
              value={current.progress}
              size={96}
              label={t("learn.card.progress", { percent: current.progress })}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-[12px] font-semibold tracking-[0.08em] text-feuille-fonce uppercase">
                {t("learn.home.next.eyebrow")}
              </p>
              <h2 id="learn-next" className="text-[20px] leading-tight font-bold tracking-tight">
                {current.title}
              </h2>
              {current.next && (
                <p className="text-[15px] font-medium">
                  {t("learn.home.next.position", {
                    module: current.next.module,
                    lesson: current.next.title,
                  })}
                </p>
              )}
              <p className="text-[13px] text-ardoise">
                {t("learn.home.next.remaining", { count: current.remaining })}
              </p>
            </div>
            <ButtonLink
              href={lessonHref(current.slug, current.next?.id)}
              size="lg"
              icon={<Icon name="play" />}
              className="self-start sm:self-center"
            >
              {t("learn.home.next.cta")}
            </ButtonLink>
          </section>
        ) : (
          <section
            aria-labelledby="learn-start"
            className={cx(card, "flex flex-col items-start gap-3")}
          >
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-lime">
              <Icon name="learn" className="size-6" />
            </span>
            <h2 id="learn-start" className={sectionTitle}>
              {t("learn.home.start.title")}
            </h2>
            <p className="max-w-[560px] text-[15px] text-ardoise">{t("learn.home.start.body")}</p>
            <ButtonLink href="/app/learn/explorer?acces=free" iconAfter={<Icon name="chev-r" />}>
              {t("learn.home.start.cta")}
            </ButtonLink>
          </section>
        )}

        <section
          aria-labelledby="learn-coach"
          className="relative flex flex-col gap-3 overflow-hidden rounded-[22px] bg-sapin p-5 text-blanc lg:p-6"
        >
          <p className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-neon uppercase">
            <AiOrb size={22} />
            {t("learn.home.coach.eyebrow")}
          </p>
          <h2 id="learn-coach" className="text-[20px] leading-tight font-bold tracking-tight">
            {t("learn.home.coach.title")}
          </h2>
          <p className="text-[14px] leading-6 text-blanc/85">{t("learn.home.coach.body")}</p>
          <ButtonLink
            href="/app/learn/coach"
            variant="primary"
            iconAfter={<Icon name="chev-r" />}
            className="mt-auto self-start"
          >
            {t("learn.home.coach.cta")}
          </ButtonLink>
        </section>
      </div>

      <section aria-label={t("learn.home.stats.aria")}>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label} className={cx(card, "flex items-center gap-3 p-4 lg:p-5")}>
              <span
                aria-hidden
                className={cx(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  stat.tone,
                )}
              >
                <Icon name={stat.icon} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[24px] leading-none font-bold">{stat.value}</span>
                <span className="text-[12.5px] leading-tight text-ardoise">{stat.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="learn-todo" className={cx(card, "flex flex-col gap-3")}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="learn-todo" className={sectionTitle}>
              {t("learn.home.todo.title")}
            </h2>
            <Link
              href="/app/learn/evaluations"
              className="flex items-center gap-1 text-[13px] font-semibold text-feuille-fonce"
            >
              {t("learn.home.todo.all")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          {todo.length === 0 ? (
            <p className="text-[14px] text-ardoise">{t("learn.home.todo.empty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-sapin/8">
              {todo.map((item) => (
                <li key={item.lessonId}>
                  <Link
                    href={lessonHref(item.courseSlug, item.lessonId)}
                    className="flex items-center gap-3 py-3 hover:bg-creme/60"
                  >
                    <span
                      aria-hidden
                      className={cx(
                        "flex size-10 shrink-0 items-center justify-center rounded-[12px]",
                        item.status === "review" ? "bg-ambre-fond" : "bg-lime-clair",
                      )}
                    >
                      <Icon name={item.kind === "quiz" ? "quiz" : "edit"} className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px] font-semibold">{item.title}</span>
                      <span className="truncate text-[12.5px] text-ardoise">
                        {t(`learn.evaluations.kind.${item.kind}`)} · {item.courseTitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-feuille-fonce">
                      {t(
                        item.status === "review"
                          ? "learn.evaluations.cta.retry"
                          : "learn.evaluations.cta.start",
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="learn-cert" className={cx(card, "flex flex-col gap-3")}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="learn-cert" className={sectionTitle}>
              {t("learn.home.certificate.title")}
            </h2>
            <Link
              href="/app/learn/attestations"
              className="flex items-center gap-1 text-[13px] font-semibold text-feuille-fonce"
            >
              {t("learn.home.certificate.cta")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          {valid[0] ? (
            <Link
              href="/app/learn/attestations"
              className="flex items-center gap-4 rounded-[18px] bg-lime p-4"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sapin text-lime">
                <Icon name="certificat" className="size-6" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{valid[0].courseTitle}</span>
                <span className="text-[13px]">
                  {t("learn.home.certificate.issued", {
                    date: format.dateTime(valid[0].issuedAt, { dateStyle: "long" }),
                  })}
                </span>
              </span>
            </Link>
          ) : (
            <p className="text-[14px] text-ardoise">{t("learn.home.certificate.empty")}</p>
          )}
        </section>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="learn-others" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="learn-others" className={sectionTitle}>
              {t("learn.home.next.others")}
            </h2>
            <Link
              href="/app/learn/parcours"
              className="flex items-center gap-1 text-[13px] font-semibold text-feuille-fonce"
            >
              {t("appNav.section.learnPaths")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {others.map((course) => (
              <li key={course.enrollmentId}>
                <Link
                  href={lessonHref(course.slug, course.next?.id)}
                  className={cx(card, "flex flex-col gap-2 p-4 hover:border-sapin/25 lg:p-4")}
                >
                  <span className="line-clamp-2 text-[15px] font-semibold">{course.title}</span>
                  {course.next && (
                    <span className="truncate text-[12.5px] text-ardoise">
                      {t("learn.paths.next", { lesson: course.next.title })}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-[12px] font-semibold">
                    <ProgressBar
                      value={course.progress}
                      tone="feuille"
                      label={t("learn.card.progress", { percent: course.progress })}
                    />
                    <span className="shrink-0">
                      {t("learn.card.progress", { percent: course.progress })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecommendedCourses userId={user.id} goal={profile?.desiredJobTitles[0] ?? undefined} />
    </div>
  );
}
