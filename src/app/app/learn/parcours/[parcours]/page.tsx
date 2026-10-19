import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { ShareButton } from "@/components/talent/offer-tools";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { followPathAction } from "@/server/actions/learn-paths";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPublicPlans } from "@/server/queries/public";
import { getPathForLearner } from "@/server/services/learn-paths";
import { planForCatalogLevel } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("apprendre.path");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * A learning path (planche talent-3, « Parcours de formation »): its title, the total time, the
 * progress, then its courses in order, each with its state. « Continuer le parcours » opens the
 * next course (enrolled when the plan opens it); a course above the plan stays locked.
 */
export default async function LearnPathPage({
  params,
  searchParams,
}: PageProps<"/app/learn/parcours/[parcours]">) {
  const [{ parcours: slug }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/learn/parcours/${slug}`);
  const path = await getPathForLearner(db, user.id, slug);
  if (!path) notFound();
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const next = path.next;
  const duration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours === 0
      ? t("forMe.learn.minutes", { count: Math.max(1, rest) })
      : rest === 0
        ? t("apprendre.path.hours", { hours })
        : t("apprendre.path.hoursMinutes", { hours, minutes: rest });
  };
  const nextPlan =
    next?.state === "locked" ? planForCatalogLevel(plans, next.requiredLevel)?.name : null;

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/learn/rechercher"
        backLabel={t("apprendre.path.back")}
        title={t("apprendre.path.title")}
        end={
          <ShareButton
            url={`${siteUrl()}/app/learn/parcours/${path.slug}`}
            title={path.title}
            label={t("apprendre.path.share")}
            copied={t("apprendre.path.shared")}
            className="t-bi t-press"
          />
        }
      />
      {query.suivi === "1" && <Notice tone="ok">{t("apprendre.path.followed")}</Notice>}
      <section className="t-verre t-parc-h" aria-labelledby="pc-titre">
        <span className="t-k">{t("apprendre.path.kicker", { count: path.total })}</span>
        <h2 id="pc-titre">{path.title}</h2>
        <p>
          {[
            t("apprendre.path.total", { duration: duration(path.durationMinutes) }),
            t("apprendre.path.attestation"),
          ].join(" · ")}
        </p>
        <span
          className="t-barre"
          role="progressbar"
          aria-label={t("apprendre.path.progress", { done: path.done, total: path.total })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={path.percent}
        >
          <i style={{ width: `${path.percent}%` }} />
        </span>
      </section>
      {path.summary && <p className="t-texte-l">{path.summary}</p>}

      <ol className="t-etapes-p">
        {path.courses.map((course, index) => {
          const current = next?.slug === course.slug && course.state !== "done";
          return (
            <li key={course.slug} className="t-e">
              <span
                className={cx("t-num", course.state === "done" && "t-ok", current && "t-en")}
                aria-hidden
              >
                {course.state === "done" ? <TalentIcon name="valider" size="xs" /> : index + 1}
              </span>
              <div className="t-verre">
                <Link href={`/app/learn/${course.slug}`} className="t-lien">
                  <b>{course.title}</b>
                </Link>
                <span>
                  {course.state === "done"
                    ? t("apprendre.path.done")
                    : course.state === "active"
                      ? t("apprendre.path.active", { percent: course.progress })
                      : course.state === "locked"
                        ? t("apprendre.path.locked", { duration: duration(course.durationMinutes) })
                        : duration(course.durationMinutes)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {nextPlan && <Notice>{t("apprendre.path.nextLocked", { plan: nextPlan })}</Notice>}

      <div className="t-verre t-fort t-bas-f">
        {path.finished ? (
          <Link href="/app/learn/mes-formations?vue=terminees" className="t-bt t-p t-pl t-press">
            {t("apprendre.path.finished")}
          </Link>
        ) : next && next.state !== "locked" ? (
          <form action={followPathAction} className="contents">
            <input type="hidden" name="path" value={path.slug} />
            <button type="submit" className="t-bt t-p t-pl t-press">
              {path.followed || path.done > 0 || next.state === "active"
                ? t("apprendre.path.continue")
                : t("apprendre.path.start")}
            </button>
          </form>
        ) : (
          <Link href="/app/abonnement" className="t-bt t-p t-pl t-press">
            {t("apprendre.course.plans")}
          </Link>
        )}
      </div>
    </div>
  );
}
