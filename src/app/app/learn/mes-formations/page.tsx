import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CourseArt } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { talentAttestations } from "@/server/services/attestations";
import { followedCourses, savedCourses } from "@/server/services/learn-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("apprendre.mine");
  return { title: t("seo"), robots: { index: false } };
}

const views = ["en-cours", "terminees", "enregistrees", "attestations"] as const;
type View = (typeof views)[number];

/**
 * Mes formations (planche talent-3 § 1): in progress, finished, saved, with what is left to do
 * (quizzes, exercises); « Mes attestations » (§ 7) is a view of the same page.
 */
export default async function MyCoursesPage({
  searchParams,
}: PageProps<"/app/learn/mes-formations">) {
  const params = await searchParams;
  const view: View = views.includes(params.vue as View) ? (params.vue as View) : "en-cours";
  const user = await requireUser("/app/learn/mes-formations");
  const t = await getTranslations();
  const format = await getFormatter();
  const [followed, saved, attestations] = await Promise.all([
    followedCourses(db, user.id),
    savedCourses(db, user.id),
    talentAttestations(db, user.id),
  ]);
  const current = followed.filter((course) => !course.finished);
  const finished = followed.filter((course) => course.finished);

  if (view === "attestations")
    return (
      <div className="t-flux">
        <FlowHead
          back="/app/learn/mes-formations"
          backLabel={t("apprendre.mine.back")}
          title={t("attest.list.title")}
        />
        {attestations.length === 0 ? (
          <div className="t-verre t-carte t-vide">
            <b>{t("attest.list.empty.title")}</b>
            <span>{t("attest.list.empty.text")}</span>
            <Link href="/app/learn/mes-formations" className="t-bt t-sec t-s t-press">
              {t("attest.list.empty.cta")}
            </Link>
          </div>
        ) : (
          <ul className="t-flux t-serre">
            {attestations.map((attestation) => (
              <li key={attestation.id} className="t-verre t-att-c">
                {/* eslint-disable-next-line @next/next/no-img-element -- drawn on the server, per attestation */}
                <img
                  src={`/app/learn/attestations/${attestation.id}/apercu`}
                  alt=""
                  width={1123}
                  height={794}
                  loading="lazy"
                  decoding="async"
                />
                <span className="t-t">
                  <span className="min-w-0 flex-1">
                    <Link href={`/app/learn/attestations/${attestation.code}`} className="t-lien">
                      <b>{attestation.courseTitle}</b>
                    </Link>
                    <span>
                      {[
                        t("attest.list.passedOn", {
                          date: format.dateTime(attestation.issuedAt, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }),
                        }),
                        attestation.score !== null
                          ? t("attest.list.score", { score: attestation.score })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="t-code">{attestation.code}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );

  const tabs: { id: View; label: string; count?: number }[] = [
    { id: "en-cours", label: t("apprendre.mine.tab.current"), count: current.length },
    { id: "terminees", label: t("apprendre.mine.tab.finished"), count: finished.length },
    { id: "enregistrees", label: t("apprendre.mine.tab.saved") },
  ];
  const todo = current.flatMap((course) =>
    course.todo.map((lesson) => ({ ...lesson, slug: course.slug })),
  );
  const minutes = (value: number) => t("forMe.learn.minutes", { count: value });

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/learn"
        backLabel={t("apprendre.search.back")}
        title={t("apprendre.mine.title")}
      />
      <nav aria-label={t("apprendre.mine.tabs")} className="t-seg">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/app/learn/mes-formations${tab.id === "en-cours" ? "" : `?vue=${tab.id}`}`}
            aria-current={view === tab.id ? "page" : undefined}
            className={cx(view === tab.id && "t-on")}
          >
            {tab.label}
            {tab.count !== undefined && <small>{tab.count}</small>}
          </Link>
        ))}
      </nav>

      {view === "en-cours" && (
        <>
          {current.length === 0 ? (
            <div className="t-verre t-carte t-vide">
              <b>{t("apprendre.mine.none.current")}</b>
              <Link href="/app/learn/rechercher" className="t-bt t-p t-s t-press">
                {t("apprendre.empty.cta")}
              </Link>
            </div>
          ) : (
            <ul className="t-flux t-serre">
              {current.map((course) => (
                <li key={course.id} className="t-verre t-cont">
                  <span className="t-vign">
                    <CourseArt category={course.category} src={course.coverUrl} />
                  </span>
                  <span className="t-t">
                    <Link
                      href={
                        course.next
                          ? `/app/learn/${course.slug}/${course.next.id}`
                          : `/app/learn/${course.slug}`
                      }
                      className="t-lien"
                    >
                      <b>{course.title}</b>
                    </Link>
                    <span>
                      {[
                        course.next
                          ? t("forMe.learn.module", {
                              current: course.next.module,
                              total: course.modules,
                            })
                          : null,
                        t("apprendre.mine.left", { time: minutes(course.minutesLeft) }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="t-barre mt-1.5" aria-hidden>
                      <i style={{ width: `${course.progress}%` }} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {todo.length > 0 && (
            <section aria-labelledby="mf-todo" className="flex flex-col gap-3.5">
              <div className="t-sec-t">
                <h2 id="mf-todo">{t("apprendre.mine.todo")}</h2>
              </div>
              <ul className="t-verre t-liste t-lignes">
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
        </>
      )}

      {view === "terminees" &&
        (finished.length === 0 ? (
          <p className="t-vide-t">{t("apprendre.mine.none.finished")}</p>
        ) : (
          <ul className="t-flux t-serre">
            {finished.map((course) => (
              <li key={course.id} className="t-verre t-cont">
                <span className="t-vign">
                  <CourseArt category={course.category} src={course.coverUrl} />
                </span>
                <span className="t-t">
                  <Link href={`/app/learn/${course.slug}`} className="t-lien">
                    <b>{course.title}</b>
                  </Link>
                  <span>
                    {[
                      course.completedAt &&
                        t("apprendre.mine.finishedOn", {
                          date: format.dateTime(course.completedAt, {
                            day: "numeric",
                            month: "short",
                          }),
                        }),
                      course.certificate ? t("apprendre.mine.withAttestation") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ))}

      {view === "enregistrees" &&
        (saved.length === 0 ? (
          <p className="t-vide-t">{t("apprendre.mine.none.saved")}</p>
        ) : (
          <ul className="t-flux t-serre">
            {saved.map((course) => (
              <li key={course.slug} className="t-verre t-cont">
                <span className="t-vign">
                  <CourseArt category={course.category} src={course.coverUrl} />
                </span>
                <span className="t-t">
                  <Link href={`/app/learn/${course.slug}`} className="t-lien">
                    <b>{course.title}</b>
                  </Link>
                  <span>
                    {[
                      course.domain,
                      course.durationMinutes >= 60
                        ? t("forMe.learn.hours", {
                            count: Math.round(course.durationMinutes / 6) / 10,
                          })
                        : minutes(course.durationMinutes),
                      t("forMe.learn.modules", { count: course.modules }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ))}

      <div className="t-verre t-liste t-lignes">
        <div className="t-li">
          <span className="t-cases t-c2">
            <TalentIcon name="certificat" size="s" />
          </span>
          <span className="t-t">
            <Link href="/app/learn/mes-formations?vue=attestations" className="t-lien">
              <b>{t("attest.list.title")}</b>
            </Link>
            <span>{t("attest.list.line", { count: attestations.length })}</span>
          </span>
          <TalentIcon name="suivant" />
        </div>
      </div>
    </div>
  );
}
