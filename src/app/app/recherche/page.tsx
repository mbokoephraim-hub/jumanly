import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { conversationLabels } from "@/components/connect/conversation-labels";
import { HireSearch } from "@/components/connect/hire-search";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { connectViewer } from "@/server/hire-context";
import { phoneTalentRedirect } from "@/server/phone-routes";
import { getCourseSearch, getJobSearch } from "@/server/queries/public";
import { listConversations } from "@/server/services/connect";
import { contractFilterOf } from "@/server/services/jobs";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("recherche");
  return { title: t("seo"), robots: { index: false } };
}

const PER_GROUP = 3;
const PER_VIEW = 12;
const views = ["tout", "offres", "formations"] as const;
type View = (typeof views)[number];

/**
 * Rechercher (lot 7): the offers, the courses and the conversations of the person that match the
 * words, grouped by type; each group leads to its full list. An organization's space keeps the
 * former page until its step.
 */
export default async function SearchPage({ searchParams }: PageProps<"/app/recherche">) {
  const params = await searchParams;
  const { user, viewer } = await connectViewer("/app/recherche");
  // Modèle B (B4, B9): the search of the phone is the one of Explorer.
  await phoneTalentRedirect(user.id, "/app/jobs");
  if (await inOrganizationSpace(user.id)) return <HireSearch params={params} />;
  const t = await getTranslations();
  const d = dynamic(t);
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const view: View = views.includes(params.vue as View) ? (params.vue as View) : "tout";
  const encoded = encodeURIComponent(query);

  const field = (
    <form action="/app/recherche" role="search" className="t-verre t-rech">
      <TalentIcon name="recherche" size="s" />
      <label htmlFor="recherche-q" className="sr-only">
        {t("recherche.label")}
      </label>
      {view !== "tout" && <input type="hidden" name="vue" value={view} />}
      <input
        id="recherche-q"
        name="q"
        type="search"
        defaultValue={query}
        maxLength={100}
        placeholder={t("recherche.placeholder")}
        autoComplete="off"
        enterKeyHint="search"
      />
      {query && (
        <Link
          href={view === "tout" ? "/app/recherche" : `/app/recherche?vue=${view}`}
          aria-label={t("recherche.clear")}
          className="t-bi t-press"
        >
          <TalentIcon name="fermer" size="s" />
        </Link>
      )}
    </form>
  );
  const head = (
    <FlowHead back="/app" backLabel={t("recherche.back")} title={t("recherche.title")} />
  );

  if (!query) {
    return (
      <div className="t-flux">
        {head}
        {field}
        <p className="t-aide-c">{t("recherche.prompt")}</p>
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
      className="t-press"
    >
      {label}
    </Link>
  );

  return (
    <div className="t-flux">
      {head}
      {field}
      <nav aria-label={t("recherche.tabs")} className="t-seg">
        {tab("tout", t("recherche.tab.all"))}
        {tab("offres", t("recherche.tab.offers"))}
        {tab("formations", t("recherche.tab.courses"))}
      </nav>
      <p role="status" className="sr-only">
        {t("recherche.results", { count: total, query })}
      </p>
      {total === 0 ? (
        <p className="t-gar">
          <TalentIcon name="recherche" size="s" />
          <span>{t("recherche.empty", { query })}</span>
        </p>
      ) : (
        <>
          {view !== "formations" && jobs.total > 0 && (
            <Group
              id="recherche-offres"
              title={t("recherche.group.offers")}
              more={{
                href: `/app/jobs?q=${encoded}`,
                label: t("recherche.seeAll", { count: jobs.total }),
              }}
            >
              {jobs.jobs.slice(0, limit).map((job) => (
                <Item
                  key={job.slug}
                  href={`/app/jobs/${job.slug}`}
                  icon="offre"
                  tone="t-c3"
                  title={job.title}
                  meta={[
                    job.organization.name,
                    job.city,
                    d(`jobs.search.contract.${contractFilterOf(job.contractType)}`),
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
              title={t("recherche.group.courses")}
              more={{
                href: `/app/learn/rechercher?q=${encoded}`,
                label: t("recherche.seeAll", { count: courses.total }),
              }}
            >
              {courses.courses.slice(0, limit).map((course) => (
                <Item
                  key={course.slug}
                  href={`/app/learn/${course.slug}`}
                  icon="former"
                  tone="t-c1"
                  title={course.title}
                  meta={course.category}
                />
              ))}
            </Group>
          )}
          {view === "tout" && threads.length > 0 && (
            <Group
              id="recherche-messages"
              title={t("recherche.group.conversations")}
              more={
                threads.length > PER_GROUP
                  ? {
                      href: `/app/messages?q=${encoded}`,
                      label: t("recherche.seeAll", { count: threads.length }),
                    }
                  : undefined
              }
            >
              {threads.slice(0, PER_GROUP).map(({ conversation, name, job }) => (
                <Item
                  key={conversation.id}
                  href={`/app/messages/${conversation.id}`}
                  icon="message"
                  tone="t-c2"
                  title={name}
                  meta={job ?? undefined}
                />
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  );
}

function Group({
  id,
  title,
  more,
  children,
}: {
  id: string;
  title: string;
  more?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-titre`} className="t-flux">
      <div className="t-sec-t">
        <h2 id={`${id}-titre`}>{title}</h2>
        {more && <Link href={more.href}>{more.label}</Link>}
      </div>
      <ul className="t-verre t-liste t-lignes">{children}</ul>
    </section>
  );
}

function Item({
  href,
  icon,
  tone,
  title,
  meta,
}: {
  href: string;
  icon: TalentIconName;
  tone: "t-c1" | "t-c2" | "t-c3";
  title: string;
  meta?: string;
}) {
  return (
    <li>
      <Link href={href} className="t-li t-press">
        <span className={cx("t-cases", tone)} aria-hidden>
          <TalentIcon name={icon} size="s" />
        </span>
        <span className="t-t">
          <b>{title}</b>
          {meta && <span>{meta}</span>}
        </span>
        <TalentIcon name="suivant" />
      </Link>
    </li>
  );
}
