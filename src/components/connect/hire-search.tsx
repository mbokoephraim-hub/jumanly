import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { PhoneTitle } from "@/components/talent/page-title";
import { RecentSearches } from "@/components/layout/recent-searches";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "@/components/brand/icon";
import { conversationLabels } from "@/components/connect/conversation-list";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { getCourseSearch, getJobSearch } from "@/server/queries/public";
import { listConversations } from "@/server/services/connect";
import { contractFilterOf } from "@/server/services/jobs";

const PER_GROUP = 3;
const PER_VIEW = 12;
const views = ["tout", "offres", "formations"] as const;
type View = (typeof views)[number];

/**
 * Search of the top bar (Admin v4, étape 3) for an organization's space, until its step of the
 * refonte: the courses, the offers and the conversations of the active space that match the words,
 * grouped by type; each group links to its full list.
 */
export async function HireSearch({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const view: View = views.includes(params.vue as View) ? (params.vue as View) : "tout";
  const { viewer } = await connectViewer("/app/recherche");
  const t = await getTranslations("appNav.search");
  const tNav = await getTranslations("appNav");
  const tContract = await getTranslations("jobs.search.contract");
  const encoded = encodeURIComponent(query);
  const field = (
    <form action="/app/recherche" role="search" className="relative">
      <label htmlFor="recherche-q" className="sr-only">
        {tNav("search.aria")}
      </label>
      {view !== "tout" && <input type="hidden" name="vue" value={view} />}
      <Icon
        name="recherche"
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2"
      />
      <input
        id="recherche-q"
        name="q"
        type="search"
        defaultValue={query}
        placeholder={tNav("search.placeholder")}
        autoComplete="off"
        enterKeyHint="search"
        className="h-16 w-full rounded-[22px] bg-blanc pr-14 pl-13 text-[17px] ring-2 shadow-douce ring-transparent outline-none placeholder:text-ardoise focus-visible:ring-sapin [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <Link
          href={view === "tout" ? "/app/recherche" : `/app/recherche?vue=${view}`}
          aria-label={t("clear")}
          className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-ardoise hover:bg-creme"
        >
          <Icon name="fermer" className="size-5" />
        </Link>
      )}
    </form>
  );
  const recent = (
    <RecentSearches query={query} labels={{ title: t("recent.title"), clear: t("recent.clear") }} />
  );
  const header = (
    <>
      <PhoneTitle back="/app" backLabel={t("back")} title={t("phoneTitle")} />
      <AppPageHeader title={t("title")} className="max-md:hidden" />
    </>
  );

  if (!query) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        {field}
        <p className="text-[15px] text-ardoise">{t("prompt")}</p>
        {recent}
      </div>
    );
  }

  const needle = query.toLocaleLowerCase("fr");
  const [courses, jobs, conversations] = await Promise.all([
    getCourseSearch({ q: query }),
    getJobSearch({ q: query }),
    listConversations(db, viewer),
  ]);
  const threads = conversations
    .map((conversation) => ({ conversation, ...conversationLabels(conversation, viewer) }))
    .filter(({ name, job }) => `${name} ${job ?? ""}`.toLocaleLowerCase("fr").includes(needle));
  const total = courses.total + jobs.total + threads.length;
  const limit = view === "tout" ? PER_GROUP : PER_VIEW;
  const tab = (id: View, label: string) => (
    <Link
      key={id}
      href={id === "tout" ? `/app/recherche?q=${encoded}` : `/app/recherche?q=${encoded}&vue=${id}`}
      aria-current={view === id ? "page" : undefined}
      className={cx(
        "flex h-12 flex-1 items-center justify-center rounded-pill text-[16px]",
        view === id ? "bg-blanc font-semibold shadow-douce" : "text-sapin",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-5">
      {header}
      {field}
      <nav aria-label={t("tab.label")}>
        <div className="flex gap-1 rounded-pill bg-sapin/8 p-1">
          {tab("tout", t("tab.all"))}
          {tab("offres", t("tab.jobs"))}
          {tab("formations", t("tab.courses"))}
        </div>
      </nav>
      <p role="status" className="sr-only">
        {t("results", { count: total, query })}
      </p>
      {total === 0 ? (
        <p className="rounded-[22px] bg-blanc p-5 text-[15px] text-ardoise shadow-douce">
          {t("empty", { query })}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {view !== "formations" && jobs.total > 0 && (
            <Group
              id="recherche-offres"
              title={t("section.jobs")}
              count={jobs.total}
              more={{ href: `/app/jobs?q=${encoded}`, label: t("seeJobs", { query }) }}
            >
              {jobs.jobs.slice(0, limit).map((job) => (
                <Item
                  key={job.slug}
                  href={`/app/jobs/${job.slug}`}
                  icon="jobs"
                  tile="bg-lime"
                  title={job.title}
                  meta={[
                    job.organization.name,
                    job.city,
                    tContract(contractFilterOf(job.contractType)),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </Group>
          )}
          {view !== "offres" && courses.total > 0 && (
            <Group
              id="recherche-formations"
              title={t("section.courses")}
              count={courses.total}
              more={{
                href: `/app/learn/rechercher?q=${encoded}`,
                label: t("seeCourses", { query }),
              }}
            >
              {courses.courses.slice(0, limit).map((course) => (
                <Item
                  key={course.slug}
                  href={`/app/learn/${course.slug}`}
                  icon="learn"
                  tile="bg-neon"
                  title={course.title}
                  meta={course.category}
                />
              ))}
            </Group>
          )}
          {view === "tout" && threads.length > 0 && (
            <Group
              id="recherche-messages"
              title={t("section.messages")}
              count={threads.length}
              more={
                threads.length > PER_GROUP
                  ? { href: `/app/messages?q=${encoded}`, label: t("seeAll") }
                  : undefined
              }
            >
              {threads.slice(0, PER_GROUP).map(({ conversation, name, job }) => (
                <Item
                  key={conversation.id}
                  href={`/app/messages/${conversation.id}`}
                  icon="message"
                  tile="bg-menthe-claire"
                  title={name}
                  meta={job ?? undefined}
                />
              ))}
            </Group>
          )}
        </div>
      )}
      {recent}
    </div>
  );
}

function Group({
  id,
  title,
  count,
  more,
  children,
}: {
  id: string;
  title: string;
  count: number;
  more?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-3">
      <h2
        id={`${id}-title`}
        className="flex items-center gap-2.5 text-[14px] font-semibold tracking-[0.06em] text-ardoise uppercase"
      >
        {title}
        <span className="rounded-pill bg-blanc px-2.5 py-0.5 text-[13px] tracking-normal text-sapin shadow-douce">
          {count}
        </span>
      </h2>
      <ul className="flex flex-col overflow-hidden rounded-[24px] bg-blanc shadow-douce">
        {children}
      </ul>
      {more && (
        <Link
          href={more.href}
          className="flex items-center gap-1.5 self-start text-[15px] font-semibold text-feuille-fonce hover:underline"
        >
          {more.label}
          <Icon name="chev-r" className="size-4" />
        </Link>
      )}
    </section>
  );
}

function Item({
  href,
  icon,
  tile,
  title,
  meta,
}: {
  href: string;
  icon: IconName;
  tile: string;
  title: string;
  meta?: string;
}) {
  return (
    <li className="border-b border-brume last:border-b-0">
      <Link
        href={href}
        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-creme/60 focus-visible:bg-creme"
      >
        <span
          aria-hidden
          className={cx("flex size-12 shrink-0 items-center justify-center rounded-[16px]", tile)}
        >
          <Icon name={icon} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15.5px] leading-snug font-semibold">{title}</span>
          {meta && <span className="truncate text-[14px] text-ardoise">{meta}</span>}
        </span>
        <Icon name="chev-r" className="size-5 shrink-0 text-ardoise" />
      </Link>
    </li>
  );
}
