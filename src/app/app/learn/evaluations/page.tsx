import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { TabRail } from "@/components/motion/tab-rail";
import { ButtonLink, EmptyState, segmentedItem, segmentedList } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { learnerEvaluations, type EvaluationStatus } from "@/server/services/learn-academy";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.evaluations");
  return { title: t("seo"), robots: { index: false } };
}

const filters = { "": "todo", "a-revoir": "review", reussies: "passed" } as const;
type Filter = keyof typeof filters;

/**
 * « Exercices et évaluations » of the Learn academy (ux-test, étape 2): every quiz and exercise of
 * the learner's courses, sorted by what is left to do, with the way back into the lesson and, for a
 * failed quiz, to the AI coach to understand the mistake (it never gives the answers).
 */
export default async function LearnEvaluationsPage({
  searchParams,
}: PageProps<"/app/learn/evaluations">) {
  const params = await searchParams;
  const filter: Filter =
    typeof params.filtre === "string" && params.filtre in filters ? (params.filtre as Filter) : "";
  const user = await requireUser("/app/learn/evaluations");
  const t = await getTranslations();
  const all = await learnerEvaluations(db, user.id);
  const of = (status: EvaluationStatus) => all.filter((item) => item.status === status);
  const shown = of(filters[filter]);
  const href = (key: Filter) =>
    key ? `/app/learn/evaluations?filtre=${key}` : "/app/learn/evaluations";

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        eyebrow={t("learn.evaluations.eyebrow")}
        title={t("learn.evaluations.title")}
      />
      <p className="max-w-[760px] text-[15px] text-ardoise">{t("learn.evaluations.intro")}</p>

      <nav aria-label={t("learn.evaluations.tabs")} className="max-w-full min-w-0">
        <TabRail name="learn-evaluations" className="bg-transparent! p-0!">
          <ul className={segmentedList}>
            {(Object.keys(filters) as Filter[]).map((key) => (
              <li key={key}>
                <Link
                  href={href(key)}
                  aria-current={filter === key ? "page" : undefined}
                  className={segmentedItem(filter === key)}
                >
                  {t(`learn.evaluations.tab.${filters[key]}`, {
                    count: of(filters[key]).length,
                  })}
                </Link>
              </li>
            ))}
          </ul>
        </TabRail>
      </nav>

      {shown.length === 0 ? (
        <EmptyState
          title={t(`learn.evaluations.empty.${filters[filter]}`)}
          action={
            filter === "" ? (
              <ButtonLink href="/app/learn/explorer">{t("learn.evaluations.empty.cta")}</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((item) => {
            const lesson = `/app/learn/${item.courseSlug}?lecon=${item.lessonId}`;
            return (
              <li
                key={item.lessonId}
                className="flex flex-col gap-3 rounded-[22px] border border-sapin/8 bg-blanc p-4 lg:p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cx(
                      "flex size-11 shrink-0 items-center justify-center rounded-[13px]",
                      item.status === "passed"
                        ? "bg-menthe-claire"
                        : item.status === "review"
                          ? "bg-ambre-fond"
                          : "bg-lime-clair",
                    )}
                  >
                    <Icon
                      name={
                        item.status === "passed" ? "check" : item.kind === "quiz" ? "quiz" : "edit"
                      }
                      className="size-5"
                    />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-[11.5px] font-semibold tracking-[0.08em] text-feuille-fonce uppercase">
                      {t(`learn.evaluations.kind.${item.kind}`)}
                    </p>
                    <h2 className="text-[16px] leading-snug font-semibold">{item.title}</h2>
                    <p className="truncate text-[13px] text-ardoise">{item.courseTitle}</p>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ardoise">
                  {item.kind === "quiz" && item.questions > 0 && (
                    <li>{t("learn.evaluations.questions", { count: item.questions })}</li>
                  )}
                  <li>{t("learn.evaluations.minutes", { minutes: item.minutes })}</li>
                  {item.passingScore !== undefined && (
                    <li>{t("learn.evaluations.passing", { score: item.passingScore })}</li>
                  )}
                  {item.bestScore !== undefined && (
                    <li className="font-semibold text-sapin">
                      {t("learn.evaluations.best", { score: item.bestScore })} ·{" "}
                      {t("learn.evaluations.attempts", { count: item.attempts })}
                    </li>
                  )}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    href={lesson}
                    size="sm"
                    variant={item.status === "passed" ? "tertiary" : "secondary"}
                  >
                    {t(
                      item.status === "passed"
                        ? "learn.evaluations.cta.review"
                        : item.status === "review"
                          ? "learn.evaluations.cta.retry"
                          : "learn.evaluations.cta.start",
                    )}
                  </ButtonLink>
                  {item.status === "review" && (
                    <ButtonLink
                      href={`/app/learn/coach?formation=${item.courseSlug}&lecon=${item.lessonId}&aide=erreur`}
                      size="sm"
                      variant="tertiary"
                      icon={<Icon name="intelligence" />}
                    >
                      {t("learn.evaluations.cta.coach")}
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
