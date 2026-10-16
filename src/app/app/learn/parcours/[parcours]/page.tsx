import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { Alert, Badge, Button, ButtonLink, ProgressBar } from "@/components/ui";
import { durationParts } from "@/lib/format";
import { cx } from "@/lib/cx";
import { followPathAction, unfollowPathAction } from "@/server/actions/learn-paths";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPublicPlans } from "@/server/queries/public";
import { asDomainIcon } from "@/server/services/learn-domains";
import { getPathForLearner, type LearnerPath } from "@/server/services/learn-paths";
import { planForCatalogLevel } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.path");
  return { title: t("seo"), robots: { index: false } };
}

const stateTone = {
  done: "success",
  active: "lime",
  todo: "neutral",
  locked: "warning",
} as const;

/**
 * One learning path (Learn v2, étape 2): its courses in the advised order, each with its state for
 * the learner, the progress and the next step. Following the path opens its next course; a course
 * the plan does not open stays locked (the path opens nothing by itself).
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
  const planOf = (requiredLevel: string) => planForCatalogLevel(plans, requiredLevel)?.name ?? "";
  const duration = durationParts(path.durationMinutes);
  const next = path.next;

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        eyebrow={
          <Link
            href="/app/learn/explorer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <Icon name="chev-l" className="size-3.5" />
            {t("learn.path.back")}
          </Link>
        }
        title={path.title}
        subtitle={path.summary}
      />
      {query.suivi === "1" && <Alert tone="success" title={t("learn.path.followed")} />}
      {query.suivi === "0" && <Alert tone="info" title={t("learn.path.unfollowed")} />}

      <section
        aria-labelledby="path-progress"
        className="flex flex-col gap-4 rounded-[22px] border border-sapin/8 bg-blanc p-4 lg:flex-row lg:items-center lg:gap-8 lg:p-5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="flex flex-wrap gap-2">
            <Badge tone="lime" icon={<Icon name="objectif" />}>
              {t("learn.path.eyebrow")}
            </Badge>
            {path.domain && (
              <Badge tone="neutral" icon={<Icon name={asDomainIcon(path.domain.icon)} />}>
                {path.domain.name}
              </Badge>
            )}
            {path.editorialLine !== "originals" && (
              <Badge tone="sapin">{t(`learn.editorial.${path.editorialLine}`)}</Badge>
            )}
            <Badge tone="outline" icon={<Icon name="horloge" />}>
              {t(`ui.duration.${duration.key}`, duration.values)}
            </Badge>
          </p>
          <h2 id="path-progress" className="text-[15px] font-semibold">
            {t("learn.path.progress", { done: path.done, total: path.total })}
          </h2>
          <ProgressBar
            value={path.percent}
            tone="feuille"
            label={t("learn.path.progress", { done: path.done, total: path.total })}
          />
          {path.finished && <p className="text-[14px] text-up-texte">{t("learn.path.finished")}</p>}
          {next?.state === "locked" && (
            <p className="text-[13.5px] text-ardoise">
              {t("learn.path.nextLocked", { plan: planOf(next.requiredLevel) })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
          {next && next.state !== "locked" && (
            <form action={followPathAction}>
              <input type="hidden" name="path" value={path.slug} />
              <Button type="submit" icon={<Icon name="play" />} className="w-full">
                {path.followed || path.done > 0 || next.state === "active"
                  ? t("learn.path.continue", { course: next.title })
                  : t("learn.path.start")}
              </Button>
            </form>
          )}
          {next?.state === "locked" && (
            <ButtonLink href="/tarifs" icon={<Icon name="etoile" />}>
              {t("learn.path.plans")}
            </ButtonLink>
          )}
          {path.followed && (
            <form action={unfollowPathAction}>
              <input type="hidden" name="path" value={path.slug} />
              <Button type="submit" variant="tertiary" size="sm" className="w-full">
                {t("learn.path.unfollow")}
              </Button>
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="path-steps" className="flex flex-col gap-3">
        <h2 id="path-steps" className="text-[20px] leading-tight font-bold tracking-tight">
          {t("learn.path.steps")}
        </h2>
        <ol className="flex flex-col gap-3">
          {path.courses.map((course, index) => (
            <PathStep
              key={course.slug}
              course={course}
              number={index + 1}
              current={next?.slug === course.slug}
              plan={planOf(course.requiredLevel)}
            />
          ))}
        </ol>
        <p className="flex items-start gap-2 text-[13px] text-ardoise">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          {t("learn.path.access")}
        </p>
      </section>
    </div>
  );
}

async function PathStep({
  course,
  number,
  current,
  plan,
}: {
  course: LearnerPath["courses"][number];
  number: number;
  current: boolean;
  plan: string;
}) {
  const t = await getTranslations();
  const duration = durationParts(course.durationMinutes);
  return (
    <li
      className={cx(
        "flex flex-col gap-3 rounded-[22px] border bg-blanc p-4 sm:flex-row sm:items-center sm:gap-5 lg:p-5",
        current ? "border-feuille ring-1 ring-feuille" : "border-sapin/8",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "flex size-12 shrink-0 items-center justify-center rounded-[14px] text-[16px] font-bold",
          course.state === "done" ? "bg-menthe-claire" : "bg-lime",
        )}
      >
        {course.state === "done" ? <Icon name="check" className="size-5" /> : number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[12px] font-semibold text-feuille-fonce">
          {t("learn.path.step", { number })}
        </p>
        <Link
          href={`/app/learn/${course.slug}`}
          className="text-[16px] leading-snug font-semibold hover:underline"
        >
          {course.title}
        </Link>
        <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-ardoise">
          <Badge tone={stateTone[course.state]}>
            {course.state === "active"
              ? t("learn.path.state.active", { percent: course.progress })
              : course.state === "locked"
                ? t("learn.path.state.locked", { plan })
                : t(`learn.path.state.${course.state}`)}
          </Badge>
          <span>{t(`ui.duration.${duration.key}`, duration.values)}</span>
          {course.certificateEnabled && (
            <span className="inline-flex items-center gap-1">
              <Icon name="certificat" className="size-3.5" />
              {t("learn.card.certificate")}
            </span>
          )}
        </p>
      </div>
      <ButtonLink
        href={`/app/learn/${course.slug}`}
        variant={current ? "secondary" : "tertiary"}
        className="self-start sm:self-center"
      >
        {t("learn.path.open")}
      </ButtonLink>
    </li>
  );
}
