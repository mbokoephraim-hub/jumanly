import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { TopSearch } from "@/components/layout/top-search";
import { Icon, type IconName } from "@/components/brand/icon";
import { conversationLabels } from "@/components/connect/conversation-list";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { getCourseSearch, getJobSearch } from "@/server/queries/public";
import { listConversations } from "@/server/services/connect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("appNav.search");
  return { title: t("title"), robots: { index: false } };
}

const PER_GROUP = 5;

/**
 * Search of the top bar (Admin v4, étape 3): the courses, the offers and the conversations of the
 * active space that match the words, grouped by type; each group links to its full list.
 */
export default async function SearchPage({ searchParams }: PageProps<"/app/recherche">) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const { viewer } = await connectViewer("/app/recherche");
  const t = await getTranslations("appNav.search");
  const tNav = await getTranslations("appNav");
  // Phone and tablet: the top bar shows only an icon, so the field is here.
  const field = (
    <TopSearch
      id="recherche-q"
      action="/app/recherche"
      label={tNav("search.aria")}
      placeholder={tNav("search.placeholder")}
      shortcut={tNav("search.shortcut")}
      defaultValue={query}
      className="max-w-none lg:hidden"
    />
  );

  if (!query) {
    return (
      <div className="flex flex-col gap-5">
        <AppPageHeader title={t("title")} subtitle={t("subtitle")} />
        {field}
        <p className="rounded-[20px] bg-blanc p-5 text-[14px] text-ardoise">{t("prompt")}</p>
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
  const encoded = encodeURIComponent(query);

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader title={t("title")} subtitle={t("results", { count: total, query })} />
      {field}
      {total === 0 ? (
        <p className="rounded-[20px] bg-blanc p-5 text-[14px] text-ardoise">
          {t("empty", { query })}
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Group
            id="recherche-formations"
            icon="learn"
            title={t("section.courses")}
            count={courses.total}
            more={courses.total > PER_GROUP ? `/app/learn/explorer?q=${encoded}` : undefined}
            seeAll={t("seeAll")}
          >
            {courses.courses.slice(0, PER_GROUP).map((course) => (
              <Item
                key={course.slug}
                href={`/app/learn/${course.slug}`}
                title={course.title}
                meta={course.category}
              />
            ))}
          </Group>
          <Group
            id="recherche-offres"
            icon="jobs"
            title={t("section.jobs")}
            count={jobs.total}
            more={jobs.total > PER_GROUP ? `/app/jobs?q=${encoded}` : undefined}
            seeAll={t("seeAll")}
          >
            {jobs.jobs.slice(0, PER_GROUP).map((job) => (
              <Item
                key={job.slug}
                href={`/app/jobs/${job.slug}`}
                title={job.title}
                meta={[job.organization.name, job.city].filter(Boolean).join(" · ")}
              />
            ))}
          </Group>
          <Group
            id="recherche-messages"
            icon="message"
            title={t("section.messages")}
            count={threads.length}
            more={threads.length > PER_GROUP ? `/app/messages?q=${encoded}` : undefined}
            seeAll={t("seeAll")}
          >
            {threads.slice(0, PER_GROUP).map(({ conversation, name, job }) => (
              <Item
                key={conversation.id}
                href={`/app/messages/${conversation.id}`}
                title={name}
                meta={job ?? undefined}
              />
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({
  id,
  icon,
  title,
  count,
  more,
  seeAll,
  children,
}: {
  id: string;
  icon: IconName;
  title: string;
  count: number;
  more?: string;
  seeAll: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-2 rounded-[20px] bg-blanc p-4 ring-1 ring-sapin/6"
    >
      <h2 id={`${id}-title`} className="flex items-center gap-2.5 text-[15px] font-semibold">
        <span
          aria-hidden
          className="jm-title-tile grid size-8 place-items-center rounded-[10px] text-blanc [&_svg]:size-4"
        >
          <Icon name={icon} />
        </span>
        {title}
        <span className="ml-auto text-[12.5px] font-medium text-ardoise">{count}</span>
      </h2>
      {count > 0 && <ul className="flex flex-col">{children}</ul>}
      {more && (
        <Link
          href={more}
          className="jm-tap mt-1 self-start text-[13px] font-semibold underline-offset-4 hover:underline"
        >
          {seeAll}
        </Link>
      )}
    </section>
  );
}

function Item({ href, title, meta }: { href: string; title: string; meta?: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-col rounded-[12px] px-2.5 py-2 hover:bg-creme focus-visible:bg-creme"
      >
        <span className="text-[13.5px] leading-5 font-medium">{title}</span>
        {meta && <span className="text-[12px] leading-4 text-ardoise">{meta}</span>}
      </Link>
    </li>
  );
}
