import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CourseArt } from "@/components/talent/art";
import { BackButton } from "@/components/talent/back-button";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OfferCard } from "@/components/talent/offer-card";
import { OfferStickyHead, ShareButton } from "@/components/talent/offer-tools";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { enrollAction, toggleSavedCourseAction } from "@/server/actions/learn";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPublicPlans } from "@/server/queries/public";
import { forMeJobs } from "@/server/services/for-me";
import { jobCards } from "@/server/services/jobs";
import { getLearnerCourse, lessonsOf, requiredLessons } from "@/server/services/learn";
import { planForCatalogLevel } from "@/server/services/plans";

export async function generateMetadata({
  params,
}: PageProps<"/app/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("apprendre.course");
  const course = await db.course.findFirst({
    where: { slug, status: "published" },
    select: { title: true },
  });
  return { title: t("seo", { title: course?.title ?? slug }), robots: { index: false } };
}

const errors = ["locked", "notEnrolled", "attempts", "invalid", "notFound"];

/**
 * A course (planche talent-3 § 3, 4 and 8): its banner, domain and level, the figures, what you
 * will know and the modules, then « Commencer la formation ». A course above the talent's plan
 * shows its locked modules and « Voir les formules » (the plan is read from the rights, never
 * named in the code). Once finished, `?vue=terminee` shows the attestation and what was added to
 * the profile. Old player addresses (`?lecon=`) lead to the classroom.
 */
export default async function LearnCoursePage({
  params,
  searchParams,
}: PageProps<"/app/learn/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const param = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : undefined;
  const legacyLesson = param("lecon");
  if (legacyLesson) {
    const rest = new URLSearchParams();
    for (const key of ["tentative", "module", "inscrit", "note"])
      if (param(key)) rest.set(key, param(key)!);
    const text = rest.toString();
    redirect(
      `/app/learn/${encodeURIComponent(slug)}/${encodeURIComponent(legacyLesson)}${text ? `?${text}` : ""}`,
    );
  }
  if (param("bravo") || param("termine") === "1")
    redirect(`/app/learn/${encodeURIComponent(slug)}?vue=terminee`);

  const user = await requireUser(`/app/learn/${slug}`);
  const [found, plans] = await Promise.all([getLearnerCourse(db, user.id, slug), getPublicPlans()]);
  if (!found) notFound();
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const { course, enrollment, open, saved } = found;
  const certificate = enrollment?.certificate?.revokedAt ? null : enrollment?.certificate;
  const lessons = lessonsOf(course);
  const done = new Set(enrollment?.completedLessons ?? []);
  const lessonHref = (id: string) => `/app/learn/${course.slug}/${id}`;
  const minutes = (value: number) =>
    value >= 60
      ? t("forMe.learn.hours", { count: Math.round(value / 6) / 10 })
      : t("forMe.learn.minutes", { count: Math.max(1, value) });

  // ── Formation terminée (§ 8) ──────────────────────────────────────────────
  if (param("vue") === "terminee" && enrollment?.completedAt) {
    const offers = await forMeJobs(db, user.id, 1);
    const [job] = await jobCards(
      db,
      offers.jobs.map((item) => item.jobId),
    );
    const [savedJob, applied] = job
      ? await Promise.all([
          db.savedJob.findFirst({
            where: { userId: user.id, jobId: job.id },
            select: { jobId: true },
          }),
          db.application.findFirst({
            where: { profile: { userId: user.id }, jobId: job.id },
            select: { id: true },
          }),
        ])
      : [null, null];
    const explanation = offers.jobs[0]?.explanation;
    const skills = certificate?.skills.length
      ? certificate.skills
      : course.skills.map((item) => item.skill.name);
    return (
      <div className="t-flux">
        <FlowHead
          back={`/app/learn/${course.slug}`}
          backLabel={t("apprendre.course.back")}
          title={t("apprendre.done.title")}
          end={
            <Link href="/app/learn" className="t-bi t-press" aria-label={t("apprendre.done.close")}>
              <TalentIcon name="fermer" size="s" />
            </Link>
          }
        />
        <section className="t-verre t-att" aria-labelledby="fd-fin">
          <span className="t-med" aria-hidden>
            <TalentIcon name="certificat" />
          </span>
          <h2 id="fd-fin">{course.title}</h2>
          <p>
            {[
              t("apprendre.done.passedOn", {
                date: format.dateTime(enrollment.completedAt, { day: "numeric", month: "long" }),
              }),
              certificate?.score != null
                ? t("apprendre.done.score", { score: certificate.score })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {certificate && (
            <div className="t-bts justify-center">
              <Link
                href={`/app/learn/attestations/${certificate.code}`}
                className="t-bt t-sec t-s t-press"
              >
                <TalentIcon name="profil" size="xs" />
                {t("apprendre.done.attestation")}
              </Link>
            </div>
          )}
        </section>
        {(skills.length > 0 || certificate?.onProfile) && (
          <>
            <span className="t-ck-t">{t("apprendre.done.added")}</span>
            <ul className="t-flux t-serre">
              {skills.map((skill) => (
                <li key={skill} className="t-ajoute">
                  <TalentIcon name="valider" size="s" />
                  <span>
                    {t.rich("apprendre.done.skill", { skill, b: (chunk) => <b>{chunk}</b> })}
                  </span>
                </li>
              ))}
              {certificate?.onProfile && (
                <li className="t-ajoute">
                  <TalentIcon name="valider" size="s" />
                  <span>{t("apprendre.done.visible")}</span>
                </li>
              )}
            </ul>
          </>
        )}
        {job && (
          <>
            <span className="t-ck-t">{t("apprendre.done.next")}</span>
            <OfferCard
              job={job}
              match={explanation ? { state: "ok", explanation } : undefined}
              saved={Boolean(savedJob)}
              applied={Boolean(applied)}
              back={`/app/learn/${course.slug}?vue=terminee`}
              now={new Date()}
            />
          </>
        )}
      </div>
    );
  }

  // ── Détail (§ 3 and 4) ───────────────────────────────────────────────────
  const requiredPlan = open ? null : planForCatalogLevel(plans, course.requiredLevel);
  const previews = lessons.filter((lesson) => lesson.isPreview);
  const required = requiredLessons(course);
  const next =
    required.find((lesson) => !done.has(lesson.id)) ??
    lessons.find((lesson) => lesson.id === enrollment?.lastLessonId) ??
    lessons[0];
  const currentModule = enrollment && !enrollment.completedAt ? next?.module.id : undefined;
  const error = param("erreur");
  const back = `/app/learn/${course.slug}`;
  const skills = course.skills.map((item) => item.skill.name);
  const known = skills.length > 0 ? skills : course.objectives.slice(0, 6);
  const kinds = (module: (typeof course.modules)[number]) => {
    const list = [...new Set(module.lessons.map((lesson) => lesson.kind))].filter(
      (kind) => kind !== "text",
    );
    return list.length > 0
      ? new Intl.ListFormat("fr", { type: "conjunction" }).format(
          list.map((kind) => d(`apprendre.course.kind.${kind}`)),
        )
      : null;
  };
  const save = (
    <form action={toggleSavedCourseAction}>
      <input type="hidden" name="slug" value={course.slug} />
      <input type="hidden" name="back" value={back} />
      <button
        type="submit"
        className="t-bi t-press"
        aria-pressed={saved}
        aria-label={saved ? t("apprendre.course.unsave") : t("apprendre.course.save")}
      >
        <TalentIcon name="favori" />
      </button>
    </form>
  );

  return (
    <div className="t-od t-od-bas">
      <OfferStickyHead
        watch="fd-ban"
        title={course.title}
        backLabel={t("apprendre.course.backLearn")}
        fallback="/app/learn"
      >
        {save}
      </OfferStickyHead>
      <div id="fd-ban" className="t-fd-ban">
        <CourseArt category={course.category} src={course.coverUrl} />
      </div>
      <div className="t-od-top">
        <BackButton
          fallback="/app/learn"
          label={t("apprendre.course.backLearn")}
          className="t-press"
        />
        <span className="flex gap-2">
          <ShareButton
            url={`${siteUrl()}/formations/${course.slug}`}
            title={course.title}
            label={t("apprendre.course.share")}
            copied={t("apprendre.course.shared")}
            className="t-bi t-press"
          />
          {save}
        </span>
      </div>

      <div className="t-fd-id">
        <span className="t-k">
          {[course.domain?.name ?? null, d(`apprendre.search.level.${course.level}`)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <h1>{course.title}</h1>
      </div>
      {error && errors.includes(error) && <Notice tone="err">{d(`learn.error.${error}`)}</Notice>}
      {param("enregistre") === "1" && <Notice tone="ok">{t("learn.save.success")}</Notice>}

      <dl className="t-verre t-chiffres">
        <div>
          <dd>
            <b>{minutes(course.durationMinutes)}</b>
          </dd>
          <dt>{t("apprendre.course.total")}</dt>
        </div>
        <div>
          <dd>
            <b>{course.modules.length}</b>
          </dd>
          <dt>{t("apprendre.course.modules", { count: course.modules.length })}</dt>
        </div>
        <div>
          <dd>
            <b>
              {course.certificateEnabled ? t("apprendre.course.yes") : t("apprendre.course.no")}
            </b>
          </dd>
          <dt>{t("apprendre.course.attestation")}</dt>
        </div>
      </dl>

      {known.length > 0 && (
        <section className="t-verre t-bloc-t" aria-labelledby="fd-saurez">
          <h2 id="fd-saurez">{t("apprendre.course.know")}</h2>
          <div className="t-cmp">
            {known.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      )}

      <section aria-label={t("apprendre.course.program")}>
        <ol className="t-verre t-liste t-modl">
          {course.modules.map((module) => {
            const moduleMinutes = Math.round(
              module.lessons.reduce((sum, lesson) => sum + lesson.durationSec, 0) / 60,
            );
            const complete =
              enrollment !== null &&
              module.lessons.every((lesson) => lesson.jobSpecific || done.has(lesson.id));
            const free = !open && module.lessons.some((lesson) => lesson.isPreview);
            const lockedModule = !open && !free;
            const first =
              module.lessons.find((lesson) => !done.has(lesson.id) && !lesson.jobSpecific) ??
              module.lessons[0];
            const href =
              first && ((open && enrollment) || (free && first.isPreview))
                ? lessonHref(first.id)
                : null;
            const meta = [
              free ? t("apprendre.course.free") : null,
              moduleMinutes > 0 ? minutes(moduleMinutes) : null,
              open ? kinds(module) : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={module.id} className="t-li">
                <span
                  className={cx("t-num", complete && "t-ok", module.id === currentModule && "t-en")}
                  aria-hidden
                >
                  {complete ? <TalentIcon name="valider" size="xs" /> : module.order}
                </span>
                <span className="t-t">
                  {href ? (
                    <Link href={href} className="t-lien">
                      <b>{module.title}</b>
                    </Link>
                  ) : (
                    <b>{module.title}</b>
                  )}
                  {meta && <span>{meta}</span>}
                  {complete && <span className="sr-only">{t("apprendre.course.moduleDone")}</span>}
                </span>
                {lockedModule && (
                  <TalentIcon name="cadenas" size="s" label={t("apprendre.course.locked")} />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {!open && (
        <div className="t-verrou">
          <TalentIcon name="cadenas" size="s" />
          <div className="t-t">
            <b>
              {requiredPlan
                ? t("apprendre.course.lock.plan", { plan: requiredPlan.name })
                : t("apprendre.course.lock.other")}
            </b>
            {previews.length > 0 && t("apprendre.course.lock.free")}
          </div>
        </div>
      )}

      <div className="t-verre t-fort t-bas-f">
        {!open ? (
          <>
            {previews[0] && (
              <Link href={lessonHref(previews[0].id)} className="t-bt t-sec t-m t-press">
                {t("apprendre.course.freeModule")}
              </Link>
            )}
            <Link href="/app/abonnement" className="t-bt t-p t-pl t-press">
              {t("apprendre.course.plans")}
            </Link>
          </>
        ) : !enrollment ? (
          <form action={enrollAction} className="contents">
            <input type="hidden" name="slug" value={course.slug} />
            <button type="submit" className="t-bt t-a t-pl t-press">
              <TalentIcon name="lecon" size="s" />
              {t("apprendre.course.start")}
            </button>
          </form>
        ) : enrollment.completedAt ? (
          <Link href={`/app/learn/${course.slug}?vue=terminee`} className="t-bt t-a t-pl t-press">
            <TalentIcon name="certificat" size="s" />
            {t("apprendre.course.finished")}
          </Link>
        ) : (
          next && (
            <Link href={lessonHref(next.id)} className="t-bt t-a t-pl t-press">
              <TalentIcon name="lecon" size="s" />
              {done.size > 0 ? t("apprendre.course.resume") : t("apprendre.course.start")}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
