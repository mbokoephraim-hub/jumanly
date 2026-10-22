import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseArt } from "@/components/talent/art";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { forMeCourses } from "@/server/services/for-me";
import { listDomains } from "@/server/services/learn-domains";
import { myPaths } from "@/server/services/learn-paths";
import { followedCourses, suggestedPath } from "@/server/services/learn-space";
import { talentAttestations } from "@/server/services/attestations";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("apprendre");
  return { title: t("seo"), robots: { index: false } };
}

/** Old catalog addresses (`?q=`, `?liste=`…) keep working: they lead to the new screens. */
const catalogParams = ["q", "theme", "niveau", "acces", "domaine", "duree", "page"];

/** Tiles of « Par domaine » (planche talent-3 § 1): the first four domains, in their colours. */
const domainLooks: TalentIconName[] = ["cv", "progression", "connexion", "entreprise"];

/**
 * Apprendre (planche talent-3 § 1): the course to resume first, then my courses and attestations,
 * the domains and the courses recommended for me. The search under the title opens « Rechercher ».
 * On a computer (planche web talent-3 § 1), « Reprendre » in big, the domains and the recommended
 * courses on the left; my courses, attestations and paths, what is left to do and Orbi's
 * suggestion on the right. On a tablet, the side comes under « Reprendre », Orbi aside.
 */
export default async function LearnHomePage({ searchParams }: PageProps<"/app/learn">) {
  const params = await searchParams;
  // The phone (Modèle B, lot B7): the Formation tab is kept mounted by the layout.
  if (await isPhone()) {
    if (typeof params.liste === "string")
      redirect(
        params.liste === "terminees" || params.liste === "enregistrees"
          ? "/app/learn?onglet=mes-cours"
          : "/app/learn",
      );
    return null;
  }
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (typeof value === "string") query.set(key, value);
  if (typeof params.liste === "string")
    redirect(
      params.liste === "enregistrees"
        ? "/app/learn/mes-formations?vue=enregistrees"
        : params.liste === "terminees"
          ? "/app/learn/mes-formations?vue=terminees"
          : params.liste === "toutes"
            ? "/app/learn/rechercher"
            : "/app/learn/mes-formations",
    );
  if (catalogParams.some((key) => query.has(key))) redirect(`/app/learn/rechercher?${query}`);

  const user = await requireUser("/app/learn");
  const t = await getTranslations();
  const d = dynamic(t);
  const [followed, attestations, domains, picks] = await Promise.all([
    followedCourses(db, user.id),
    talentAttestations(db, user.id),
    listDomains(db),
    forMeCourses(db, user.id, { take: 8 }),
  ]);
  const inProgress = followed.filter((course) => !course.finished);
  const current = inProgress[0];
  const recommended = picks.filter((course) => course.progress === null).slice(0, 6);
  const categoryOf = (category: string) =>
    t.has(`forMe.category.${category}` as never) ? d(`forMe.category.${category}`) : category;
  const duration = (minutes: number) =>
    minutes >= 60
      ? t("forMe.learn.hours", { count: Math.round(minutes / 6) / 10 })
      : t("forMe.learn.minutes", { count: minutes });

  const done = followed.length - inProgress.length;
  const todo = inProgress
    .flatMap((course) => course.todo.map((lesson) => ({ ...lesson, slug: course.slug })))
    .slice(0, 3);
  const [path, suggestion] = await Promise.all([
    myPaths(db, user.id).then((paths) => paths.find((item) => !item.finished) ?? paths[0] ?? null),
    suggestedPath(db, user.id, [
      ...followed.map((course) => course.slug),
      ...recommended.map((course) => course.slug),
    ]),
  ]);
  const access = (course: (typeof recommended)[number]) =>
    course.free ? t("apprendre.web.free") : !course.open ? t("apprendre.web.firstFree") : null;

  return (
    <div className="t-flux t-large t-aw t-aw-acc">
      <h1 className="sr-only">{t("apprendre.title")}</h1>
      {/* Computer and tablet (planche web talent-3 § 1): the title, its line, the search on the right. */}
      <div className="t-aw-h t-ap-web">
        <div className="t-t">
          <p aria-hidden className="t-aw-h1">
            {t("apprendre.title")}
          </p>
          <p>{t("apprendre.web.lead")}</p>
        </div>
        <form
          action="/app/learn/rechercher"
          method="get"
          role="search"
          className="t-verre t-aw-rch"
        >
          <TalentIcon name="recherche" size="s" />
          <input
            name="q"
            type="search"
            aria-label={t("apprendre.search.label")}
            placeholder={t("apprendre.empty.cta")}
            enterKeyHint="search"
            autoComplete="off"
          />
        </form>
      </div>
      <nav aria-label={t("apprendre.mine.label")} className="t-acces-a t-ap-mob">
        <Link href="/app/learn/mes-formations" className="t-verre t-press">
          <TalentIcon name="lecon" size="s" />
          {t("apprendre.mine.courses")}
          <b>{inProgress.length}</b>
        </Link>
        <Link href="/app/learn/mes-formations?vue=attestations" className="t-verre t-press">
          <TalentIcon name="certificat" size="s" />
          {t("apprendre.mine.attestations")}
          <b>{attestations.length}</b>
        </Link>
      </nav>

      <div className="t-aw-g">
        <div className="t-aw-main">
          {current && (
            <article className="t-verre t-fo t-aw-rp">
              <div className="t-ban">
                <CourseArt category={current.category} src={current.coverUrl} />
                <span className="t-tg">{t("apprendre.resume")}</span>
                {current.next && current.next.durationSec > 0 && (
                  <span className="t-dur t-ap-mob">
                    {t("forMe.learn.minutes", {
                      count: Math.round(current.next.durationSec / 60),
                    })}
                  </span>
                )}
              </div>
              <div className="t-t">
                {current.next && (
                  <small className="t-ap-web">
                    {t("apprendre.web.resumeKicker", {
                      domain: current.domain ?? categoryOf(current.category),
                      current: current.next.module,
                      total: current.modules,
                    })}
                  </small>
                )}
                <Link
                  href={
                    current.next
                      ? `/app/learn/${current.slug}/${current.next.id}`
                      : `/app/learn/${current.slug}`
                  }
                  aria-label={t("forMe.learn.resumeAria", { title: current.title })}
                  className="t-lien"
                >
                  <b>{current.title}</b>
                </Link>
                <span className="t-ap-mob">
                  {[
                    current.next
                      ? t("forMe.learn.module", {
                          current: current.next.module,
                          total: current.modules,
                        })
                      : null,
                    current.domain ?? categoryOf(current.category),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="t-ap-web">
                  {t("apprendre.web.left", {
                    time: t("forMe.learn.minutes", { count: current.moduleMinutesLeft }),
                  })}
                </span>
                <span className="t-barre" aria-hidden>
                  <i style={{ width: `${current.progress}%` }} />
                </span>
                <span aria-hidden className="t-bt t-p t-m t-ap-web">
                  <TalentIcon name="lecon" size="s" />
                  {t("apprendre.web.continue")}
                </span>
              </div>
            </article>
          )}

          {domains.length > 0 && (
            <section aria-labelledby="ap-domaines" className="t-aw-dom flex flex-col gap-3.5">
              <div className="t-sec-t">
                <h2 id="ap-domaines">{t("apprendre.domains")}</h2>
                <Link href="/app/learn/rechercher">{t("apprendre.all")}</Link>
              </div>
              <ul className="t-domaines t-glisse">
                {domains.map((domain, index) => (
                  <li key={domain.id}>
                    <Link
                      href={`/app/learn/rechercher?domaine=${domain.slug}`}
                      className={`t-dom t-d${(index % 4) + 1} t-press`}
                    >
                      <span className="t-cases">
                        <TalentIcon name={domainLooks[index % 4]!} size="s" />
                      </span>
                      <span className="t-dom-t">
                        {domain.name}
                        <small className="t-ap-web">
                          {t("apprendre.web.domainCount", { count: domain.courseCount })}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recommended.length > 0 && (
            <section aria-labelledby="ap-recommandees" className="t-aw-rec flex flex-col gap-3.5">
              <div className="t-sec-t">
                <h2 id="ap-recommandees">{t("apprendre.recommended")}</h2>
                <Link href="/app/learn/rechercher">{t("apprendre.all")}</Link>
              </div>
              <ul className="t-defile t-glisse">
                {recommended.map((course) => (
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
                      <span>
                        {t("forMe.learn.modules", { count: course.modules })}
                        {access(course) && <span className="t-ap-web"> · {access(course)}</span>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Computer and tablet: my courses, attestations and paths, what is left to do, Orbi. */}
        <aside aria-label={t("apprendre.web.side")} className="t-aw-side t-ap-web">
          <ul className="t-aw-ac">
            <li>
              <Link href="/app/learn/mes-formations" className="t-verre t-press">
                <span className="t-cases t-former" aria-hidden>
                  <TalentIcon name="lecon" size="s" />
                </span>
                <span className="t-t">
                  {t("apprendre.web.mine.courses")}
                  <small>
                    {t("apprendre.web.mine.coursesLine", { current: inProgress.length, done })}
                  </small>
                </span>
                <b>{inProgress.length}</b>
              </Link>
            </li>
            <li>
              <Link href="/app/learn/mes-formations?vue=attestations" className="t-verre t-press">
                <span className="t-cases t-accomp" aria-hidden>
                  <TalentIcon name="certificat" size="s" />
                </span>
                <span className="t-t">
                  {t("apprendre.web.mine.attestations")}
                  <small>{t("apprendre.web.mine.attestationsLine")}</small>
                </span>
                <b>{attestations.length}</b>
              </Link>
            </li>
            <li>
              <Link
                href={path ? `/app/learn/parcours/${path.slug}` : "/app/learn/rechercher"}
                className="t-verre t-press"
              >
                <span className="t-cases t-oppo" aria-hidden>
                  <TalentIcon name="cap" size="s" />
                </span>
                <span className="t-t">
                  {t("apprendre.web.mine.paths")}
                  <small>{path ? path.title : t("apprendre.web.mine.pathsNone")}</small>
                </span>
                <TalentIcon name="suivant" size="xs" />
              </Link>
            </li>
          </ul>
          {todo.length > 0 && (
            <section aria-labelledby="ap-afaire" className="t-verre t-aw-af">
              <h2 id="ap-afaire">{t("apprendre.mine.todo")}</h2>
              <ul className="t-liste t-lignes">
                {todo.map((lesson) => (
                  <li key={lesson.id} className="t-li">
                    <span className={cx("t-cases", lesson.kind === "quiz" ? "t-c1" : "t-c3")}>
                      <TalentIcon name={lesson.kind === "quiz" ? "quiz" : "realisation"} size="s" />
                    </span>
                    <span className="t-t">
                      <Link href={`/app/learn/${lesson.slug}/${lesson.id}`} className="t-lien">
                        <b>
                          {lesson.kind === "quiz"
                            ? t("apprendre.mine.quiz", { title: lesson.title })
                            : t("apprendre.mine.exercise", { title: lesson.title })}
                        </b>
                      </Link>
                      <span>
                        {lesson.kind === "quiz"
                          ? t("apprendre.mine.questions", {
                              count: lesson.quiz?._count.questions ?? 0,
                            })
                          : t("apprendre.mine.whenever")}
                      </span>
                    </span>
                    <TalentIcon name="suivant" />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {suggestion && (
            <section aria-labelledby="ap-orbi" className="t-verre t-aw-os">
              <div className="t-h">
                <OrbiMark size={40} />
                <div>
                  <h2 id="ap-orbi">{t("apprendre.web.orbi.label")}</h2>
                  <span>{t("apprendre.web.orbi.sub")}</span>
                </div>
              </div>
              <p>
                {t("apprendre.web.orbi.text", {
                  title: suggestion.title,
                  count: suggestion.count,
                })}
              </p>
              <div>
                <Link href={`/app/learn/parcours/${suggestion.slug}`} className="t-press">
                  {t("apprendre.search.orbi.cta")}
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>

      {!current && recommended.length === 0 && (
        <div className="t-verre t-carte t-vide">
          <b>{t("apprendre.empty.title")}</b>
          <span>{t("apprendre.empty.text")}</span>
          <Link href="/app/learn/rechercher" className="t-bt t-p t-s t-press">
            {t("apprendre.empty.cta")}
          </Link>
        </div>
      )}
    </div>
  );
}
