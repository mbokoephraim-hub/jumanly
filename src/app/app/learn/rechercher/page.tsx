import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CourseArt } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  courseLevels,
  courseOrderBy,
  courseWhere,
  parseCourseFilters,
  type CourseFilters,
} from "@/server/services/courses";
import { catalogLevelOf } from "@/server/services/learn";
import { listDomains } from "@/server/services/learn-domains";
import { pathForCourses } from "@/server/services/learn-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("apprendre.search");
  return { title: t("seo"), robots: { index: false } };
}

const PAGE = 12;
const durations = ["heure", "court", "moyen", "long"] as const;

/**
 * Rechercher une formation (planche talent-3 § 1): the search, quick filters, the courses found
 * and, when several of them make a path, Orbi suggests it. The other filters open in a sheet.
 */
export default async function LearnSearchPage({
  searchParams,
}: PageProps<"/app/learn/rechercher">) {
  const params = await searchParams;
  const user = await requireUser("/app/learn/rechercher");
  const t = await getTranslations();
  const d = dynamic(t);
  const filters = parseCourseFilters(params);
  const shown = Math.min(120, PAGE * (filters.page ?? 1));
  const where = courseWhere(filters);
  const [plan, domains, total, courses] = await Promise.all([
    catalogLevelOf(db, user.id),
    listDomains(db),
    db.course.count({ where }),
    db.course.findMany({
      where,
      orderBy: courseOrderBy(filters.tri),
      take: shown,
      select: {
        slug: true,
        title: true,
        category: true,
        coverUrl: true,
        durationMinutes: true,
        domain: { select: { name: true } },
        _count: { select: { modules: true } },
      },
    }),
  ]);
  const path = await pathForCourses(
    db,
    courses.map((course) => course.slug),
  );

  /** The address with one filter changed (or removed), back on the first page. */
  const href = (change: Partial<Record<keyof CourseFilters, string | undefined>>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...change, page: undefined }))
      if (value !== undefined && value !== "") next.set(key, String(value));
    const text = next.toString();
    return text ? `/app/learn/rechercher?${text}` : "/app/learn/rechercher";
  };
  const active = (["acces", "niveau", "duree", "domaine"] as const).filter((key) => filters[key]);
  const chips = [
    { key: "acces" as const, value: "free", label: t("apprendre.search.chip.free") },
    { key: "niveau" as const, value: "beginner", label: t("apprendre.search.chip.beginner") },
    { key: "duree" as const, value: "heure", label: t("apprendre.search.chip.hour") },
    ...domains.slice(0, 4).map((domain) => ({
      key: "domaine" as const,
      value: domain.slug,
      label: domain.name,
    })),
  ];
  const categoryOf = (category: string) =>
    t.has(`forMe.category.${category}` as never) ? d(`forMe.category.${category}`) : category;
  const duration = (minutes: number) =>
    minutes >= 60
      ? t("forMe.learn.hours", { count: Math.round(minutes / 6) / 10 })
      : t("forMe.learn.minutes", { count: minutes });
  const radio = (
    name: keyof CourseFilters,
    options: { value: string; label: string }[],
    legend: string,
  ) => (
    <fieldset className="t-fs">
      <legend className="t-lab-c">{legend}</legend>
      <div className="t-puces">
        {[{ value: "", label: t("apprendre.search.filters.any") }, ...options].map((option) => (
          <label key={option.value || "tous"} className="t-puce">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={(filters[name] ?? "") === option.value}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/learn"
        backLabel={t("apprendre.search.back")}
        title={t("apprendre.search.title")}
      />
      <form action="/app/learn/rechercher" method="get" role="search" className="t-rech t-verre">
        <TalentIcon name="recherche" size="s" />
        <input
          key={filters.q ?? ""}
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          aria-label={t("apprendre.search.label")}
          placeholder={t("apprendre.search.placeholder")}
          enterKeyHint="search"
          autoComplete="off"
        />
        {active.map((key) => (
          <input key={key} type="hidden" name={key} value={filters[key]} />
        ))}
        <SheetButton
          target="ap-filtres"
          className="t-f t-press"
          label={
            active.length > 0
              ? t("apprendre.search.filtersCount", { count: active.length })
              : t("apprendre.search.filters.title")
          }
        >
          <TalentIcon name="filtres" size="s" />
          {active.length > 0 && <b aria-hidden>{active.length}</b>}
        </SheetButton>
      </form>

      <nav aria-label={t("apprendre.search.quick")} className="t-filtres-l t-glisse">
        {chips.map((chip) => {
          const on = filters[chip.key] === chip.value;
          return (
            <Link
              key={`${chip.key}-${chip.value}`}
              href={href({ [chip.key]: on ? undefined : chip.value })}
              aria-current={on ? "true" : undefined}
              className={cx("t-puce t-press", on && "t-on")}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>

      <p className="t-res-l" role="status">
        {t("apprendre.search.count", { count: total })}
      </p>

      {courses.length === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{t("apprendre.search.none.title")}</b>
          <span>{t("apprendre.search.none.text")}</span>
          <Link href="/app/learn/rechercher" className="t-bt t-sec t-s t-press">
            {t("apprendre.search.none.cta")}
          </Link>
        </div>
      ) : (
        <ul className="t-flux t-serre">
          {courses.map((course) => (
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
                    course.domain?.name ?? categoryOf(course.category),
                    duration(course.durationMinutes),
                    t("forMe.learn.modules", { count: course._count.modules }),
                  ].join(" · ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {total > courses.length && (
        <Link
          href={`${href({})}${href({}).includes("?") ? "&" : "?"}page=${(filters.page ?? 1) + 1}`}
          scroll={false}
          className="t-bt t-sec t-pl t-press"
        >
          {t("apprendre.search.more")}
        </Link>
      )}

      {path && (
        <div className="t-verre t-carte t-sugg">
          <OrbiMark size={36} />
          <div className="t-t">
            <small>{t("apprendre.search.orbi.label")}</small>
            <b>{t("apprendre.search.orbi.text", { title: path.title })}</b>
            <div>
              <Link href={`/app/learn/parcours/${path.slug}`} className="t-bt t-sec t-s t-press">
                {t("apprendre.search.orbi.cta")}
              </Link>
            </div>
          </div>
        </div>
      )}

      <Sheet
        id="ap-filtres"
        title={t("apprendre.search.filters.title")}
        closeLabel={t("offer.close")}
        openParam="filtres"
      >
        <form action="/app/learn/rechercher" method="get" className="t-flux">
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {radio(
            "acces",
            [
              { value: "free", label: t("apprendre.search.filters.free") },
              ...(plan !== "free"
                ? [{ value: plan, label: t("apprendre.search.filters.included") }]
                : []),
            ],
            t("apprendre.search.filters.access"),
          )}
          {radio(
            "niveau",
            courseLevels.map((level) => ({
              value: level,
              label: d(`apprendre.search.level.${level}`),
            })),
            t("apprendre.search.filters.level"),
          )}
          {radio(
            "duree",
            durations.map((value) => ({
              value,
              label: d(`apprendre.search.duration.${value}`),
            })),
            t("apprendre.search.filters.duration"),
          )}
          {domains.length > 0 &&
            radio(
              "domaine",
              domains.map((domain) => ({ value: domain.slug, label: domain.name })),
              t("apprendre.search.filters.domain"),
            )}
          <button type="submit" className="t-bt t-p t-pl t-press">
            {t("apprendre.search.filters.submit")}
          </button>
          <Link
            href={
              filters.q
                ? `/app/learn/rechercher?q=${encodeURIComponent(filters.q)}`
                : "/app/learn/rechercher"
            }
            className="t-bt t-sec t-pl t-press"
          >
            {t("apprendre.search.filters.reset")}
          </Link>
        </form>
      </Sheet>
    </div>
  );
}
