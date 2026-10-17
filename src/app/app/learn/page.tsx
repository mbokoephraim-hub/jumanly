import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HeaderAction } from "@/components/app/header-action";
import { AppPageHeader } from "@/components/app/page-header";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import {
  CourseRow,
  ForMeCourseCard,
  ForMeRow,
  ForMeSection,
  RowList,
} from "@/components/app/for-me";
import { ButtonLink, ProgressBar } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { learnerEvaluations, nextLessons } from "@/server/services/learn-academy";
import { forMeCourses } from "@/server/services/for-me";
import { myCertificates } from "@/server/services/learn";
import { listDomains } from "@/server/services/learn-domains";

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
  const [courses, evaluations, certificates, domains, picks] = await Promise.all([
    nextLessons(db, user.id),
    learnerEvaluations(db, user.id),
    myCertificates(db, user.id),
    listDomains(db),
    forMeCourses(db, user.id, { take: 8 }),
  ]);
  // Courses not followed yet: those in progress have their own card.
  const recommended = picks.filter((course) => course.progress === null).slice(0, 6);
  const current = courses[0];
  const others = courses.slice(1, 4);
  const valid = certificates.filter((certificate) => !certificate.revokedAt);
  const todo = [
    ...evaluations.filter((item) => item.status === "review"),
    ...evaluations.filter((item) => item.status === "todo"),
  ].slice(0, 3);
  const lessonHref = (slug: string, id?: string) =>
    id ? `/app/learn/${slug}?lecon=${id}` : `/app/learn/${slug}`;

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

      {current ? (
        <section
          aria-labelledby="learn-next"
          className="flex flex-col gap-3 rounded-[24px] bg-sapin p-5 text-blanc shadow-douce lg:p-6"
        >
          <p className="text-[12px] font-semibold tracking-[0.08em] text-neon uppercase">
            {t("learn.home.next.eyebrow")}
          </p>
          <h2 id="learn-next" className="text-[21px] leading-tight font-bold tracking-tight">
            {current.title}
          </h2>
          {current.next && (
            <p className="text-[14px] text-blanc/85">
              {t("learn.home.next.position", {
                module: current.next.module,
                lesson: current.next.title,
              })}
            </p>
          )}
          <ProgressBar
            value={current.progress}
            tone="lime"
            onTint
            label={t("learn.card.progress", { percent: current.progress })}
          />
          <p className="text-[13px] text-blanc/75">
            {t("learn.home.next.remaining", { count: current.remaining })}
          </p>
          <Link
            href={lessonHref(current.slug, current.next?.id)}
            className="jm-press flex min-h-12 items-center gap-2 self-start rounded-pill bg-lime px-6 text-[15px] font-semibold text-sapin"
          >
            <Icon name="play" className="size-4" />
            {t("learn.home.next.cta")}
          </Link>
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

      {recommended.length > 0 && (
        <ForMeSection
          id="learn-reco"
          title={t("learn.home.reco.title")}
          link={{ href: "/app/learn/explorer", label: t("learn.home.reco.all") }}
        >
          <CourseRow>
            {recommended.map((course, index) => (
              <ForMeCourseCard key={course.slug} course={course} index={index} />
            ))}
          </CourseRow>
        </ForMeSection>
      )}

      {domains.length > 0 && (
        <section aria-labelledby="learn-domains" className="flex flex-col gap-3">
          <h2 id="learn-domains" className={sectionTitle}>
            {t("learn.home.domains.title")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <li key={domain.slug}>
                <Link
                  href={`/app/learn/explorer?domaine=${domain.slug}`}
                  className="jm-press flex min-h-11 items-center rounded-pill bg-blanc px-4 text-[14px] font-medium shadow-douce"
                >
                  {domain.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/app/learn/explorer"
            className="jm-press flex min-h-12 items-center justify-center gap-2 rounded-pill bg-blanc text-[15px] font-semibold shadow-douce"
          >
            <Icon name="recherche" className="size-4" />
            {t("learn.home.domains.explore")}
          </Link>
        </section>
      )}

      <ForMeSection id="learn-acquis" title={t("learn.home.acquired.title")}>
        <RowList>
          <ForMeRow
            href="/app/learn/evaluations"
            icon="quiz"
            tone="bg-lime-clair"
            title={t("learn.home.acquired.evaluations")}
            line={
              todo.length > 0
                ? t("learn.home.acquired.evaluationsTodo", { count: todo.length })
                : t("learn.home.todo.empty")
            }
          />
          <ForMeRow
            href="/app/learn/attestations"
            icon="certificat"
            tone="bg-lime"
            title={t("learn.home.acquired.certificates")}
            line={t("learn.home.acquired.certificatesCount", { count: valid.length })}
          />
          <ForMeRow
            href="/app/learn/parcours"
            icon="objectif"
            tone="bg-menthe-claire"
            title={t("learn.home.acquired.paths")}
            line={t("learn.home.acquired.pathsLine", { count: courses.length })}
          />
        </RowList>
      </ForMeSection>

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
    </div>
  );
}
