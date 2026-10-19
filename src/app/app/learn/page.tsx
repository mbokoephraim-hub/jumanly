import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseArt } from "@/components/talent/art";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { forMeCourses } from "@/server/services/for-me";
import { listDomains } from "@/server/services/learn-domains";
import { followedCourses } from "@/server/services/learn-space";
import { talentAttestations } from "@/server/services/attestations";

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
 */
export default async function LearnHomePage({ searchParams }: PageProps<"/app/learn">) {
  const params = await searchParams;
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

  return (
    <div className="t-flux">
      <h1 className="sr-only">{t("apprendre.title")}</h1>
      <nav aria-label={t("apprendre.mine.label")} className="t-acces-a">
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

      {current && (
        <article className="t-verre t-fo">
          <div className="t-ban">
            <CourseArt category={current.category} src={current.coverUrl} />
            <span className="t-tg">{t("apprendre.resume")}</span>
            {current.next && current.next.durationSec > 0 && (
              <span className="t-dur">
                {t("forMe.learn.minutes", { count: Math.round(current.next.durationSec / 60) })}
              </span>
            )}
          </div>
          <div className="t-t">
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
            <span>
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
            <span className="t-barre" aria-hidden>
              <i style={{ width: `${current.progress}%` }} />
            </span>
          </div>
        </article>
      )}

      {domains.length > 0 && (
        <section aria-labelledby="ap-domaines" className="flex flex-col gap-3.5">
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
                  {domain.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommended.length > 0 && (
        <section aria-labelledby="ap-recommandees" className="flex flex-col gap-3.5">
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
                  <span>{t("forMe.learn.modules", { count: course.modules })}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
