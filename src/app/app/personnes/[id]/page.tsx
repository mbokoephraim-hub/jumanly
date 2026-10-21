import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { companyTone, explorerWords } from "@/components/phone/explorer/data";
import { PhonePerson } from "@/components/phone/explorer/person";
import { ExplorerTexts } from "@/components/phone/explorer/server";
import { feedWords, initialsOf, shortName, toneOf } from "@/components/phone/fil/data";
import { sendTargetViews } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { personPage } from "@/server/services/explore";
import { authorFeed } from "@/server/services/feed";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/** « @patrick.ilunga »: the name in small letters, without accents, joined by dots. */
function handleOf(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") || "jumanly"
  );
}

/**
 * A person's page on the phone (Modèle B, lot B4, planche Personne): who they are, their posts,
 * their profile and their achievements. Only a profile visible under its name, or a connection,
 * opens; a private or anonymous one is not found. On a computer, the space's home.
 */
export default async function PersonPage({ params }: PageProps<"/app/personnes/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/personnes/${id}`);
  if (!(await isPhone())) redirect("/app");
  if (id === user.id) redirect("/app/career/cv");
  const now = new Date();
  const [person, posts, fil, words, targets] = await Promise.all([
    personPage(db, user.id, id),
    authorFeed(db, user.id, { userId: id }),
    feedWords(user.id, now),
    explorerWords(now),
    sendTargetViews(user.id),
  ]);
  if (!person) notFound();
  const { t } = words;
  const company = person.company ? shortName(person.company) : null;
  const org = company
    ? await db.organization.findFirst({
        where: { name: { startsWith: company, mode: "insensitive" }, suspendedAt: null },
        select: { slug: true },
      })
    : null;
  const year = (date: Date) => String(date.getUTCFullYear());
  const place = (when: string, where: string | null) =>
    where ? t("person.whenPlace", { when, place: where }) : when;
  return (
    <ExplorerTexts>
      <PhonePerson
        person={{
          id: person.id,
          name: person.name,
          initials: initialsOf(person.name),
          tone: toneOf(person.name, false),
          image: person.image,
          verified: person.verified,
          handle: [t("person.handle", { handle: handleOf(person.name) }), person.city]
            .filter(Boolean)
            .join(" · "),
          title: person.title,
          company: company
            ? { name: company, href: org ? `/app/entreprises/${org.slug}` : null }
            : null,
          connections: person.connections,
          common: person.common,
          link: person.link,
          conversationId: person.conversationId,
          about: person.about,
          skills: person.skills,
          experiences: person.experiences.map((item) => {
            const name = shortName(item.company);
            return {
              id: item.id,
              initials: initialsOf(name),
              tone: companyTone(name),
              title: t("person.role", { title: item.title, place: name }),
              when: place(
                item.endDate
                  ? t("person.years", { start: year(item.startDate), end: year(item.endDate) })
                  : t("person.since", { year: year(item.startDate) }),
                item.location,
              ),
            };
          }),
          educations: person.educations.map((item) => ({
            id: item.id,
            initials: initialsOf(item.school),
            tone: companyTone(item.school),
            title: t("person.role", { title: item.degree, place: item.school }),
            when:
              item.startYear && item.endYear
                ? t("person.years", { start: String(item.startYear), end: String(item.endYear) })
                : item.endYear
                  ? String(item.endYear)
                  : "",
          })),
          works: person.works.map((work, index) => ({
            id: work.id,
            title: work.title,
            tone: index % 5,
            line: work.tool
              ? t("person.work", { tool: work.tool, count: work.images })
              : t("person.workNoTool", { count: work.images }),
          })),
        }}
        posts={posts.map(fil.post)}
        targets={targets}
      />
    </ExplorerTexts>
  );
}
