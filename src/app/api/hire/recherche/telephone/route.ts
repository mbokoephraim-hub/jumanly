import { NextResponse } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { exploreSearch } from "@/server/services/explore";
import { searchPosts } from "@/server/services/feed";
import { RH_SEARCH_SCOPES, recruiterPhoneSearch } from "@/server/services/hire-phone";
import { RH_TALENT_SEARCH, rhSearchTalents } from "@/server/services/hire-phone-talents";
import {
  RH_APPLICATION_SEARCH,
  rhSearchApplications,
} from "@/server/services/hire-phone-candidatures";

const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
  dans: z.enum(RH_SEARCH_SCOPES).catch("tout"),
});

const initials = (name: string) =>
  name
    .replace(/\(.*\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/**
 * The search in two steps of the recruiter's phone (Modèle B, lot M1), second step: from the first
 * letter, grouped results for the scope chosen (« Rechercher dans »). The organization's offers and
 * candidates are filtered by `organizationId` (`jobScope`); companies and people are those all of
 * Jumanly may see (people only when they made their profile visible). Nothing outside a space.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({ q: params.get("q") ?? "", dans: params.get("dans") });
  const fil = params.get("onglet") === "fil";
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ groups: [] }, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return NextResponse.json({ groups: [] }, { status: 403 });
  const t = await getTranslations("phoneRh.search");
  // Candidatures (Modèle B recruteur M5, planche 065): the people who applied, by name, skill or
  // city, with their score; never anyone who did not apply to the organization's offers.
  if (params.get("onglet") === "candidatures") {
    const q = (params.get("q") ?? "").trim().slice(0, 100);
    if (!q) return NextResponse.json({ groups: [] });
    const by = RH_APPLICATION_SEARCH.find((value) => value === params.get("dans")) ?? "tout";
    const [rows, format] = await Promise.all([
      rhSearchApplications(
        db,
        { userId: user.id, organizationId: space.organizationId, role: space.role },
        q,
        by,
      ),
      getFormatter(),
    ]);
    const tc = await getTranslations("phoneRhCandidatures");
    return NextResponse.json(
      {
        groups: rows.length
          ? [
              {
                title: tc("results", { count: rows.length }),
                items: rows.map((row) => ({
                  href: `/app/hire/candidats/${row.id}`,
                  title: row.name,
                  sub: tc("row.line", {
                    headline: row.headline ?? row.firstSkill ?? "",
                    hasHeadline: row.headline || row.firstSkill ? "yes" : "no",
                    years: row.years,
                  }),
                  sub2: tc("row.when", {
                    job: row.jobTitle,
                    when: format.relativeTime(row.createdAt),
                  }),
                  initials: initials(row.name),
                  score: row.score,
                  unseen: row.unseen,
                })),
              },
            ]
          : [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  // Talents (Modèle B recruteur M6, planches 102 and 103): visible talents by skill, job or city.
  if (params.get("onglet") === "talents") {
    const q = (params.get("q") ?? "").trim().slice(0, 100);
    if (!q) return NextResponse.json({ groups: [] });
    const by = RH_TALENT_SEARCH.find((value) => value === params.get("dans")) ?? "tout";
    const rows = await rhSearchTalents(
      db,
      { userId: user.id, organizationId: space.organizationId, role: space.role },
      q,
      by,
    ).catch(() => []);
    const tt = await getTranslations("phoneRhTalents");
    return NextResponse.json(
      {
        groups: rows.length
          ? [
              {
                title: tt("search.results", { count: rows.length }),
                items: rows.map((row) => ({
                  href: `/app/hire/talents/${row.profileId}`,
                  title: row.name,
                  sub: [row.headline, tt("card.years", { years: row.years })]
                    .filter(Boolean)
                    .join(" · "),
                  sub2: row.city ?? undefined,
                  initials: initials(row.name),
                })),
              },
            ]
          : [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (!parsed.success) return NextResponse.json({ groups: [] });
  const { q, dans } = parsed.data;
  // The Fil searches posts, people and companies, never the organization's offers or candidates.
  const want = (scope: (typeof RH_SEARCH_SCOPES)[number]) =>
    (dans === "tout" && !(fil && (scope === "offres" || scope === "candidats"))) || dans === scope;
  const [mine, companies, people, posts] = await Promise.all([
    want("offres") || want("candidats")
      ? recruiterPhoneSearch(
          db,
          { userId: user.id, organizationId: space.organizationId, role: space.role },
          q,
        )
      : null,
    want("entreprises")
      ? exploreSearch(db, user.id, q, "entreprises").then((found) => found.companies)
      : null,
    want("personnes")
      ? exploreSearch(db, user.id, q, "personnes").then((found) => found.people)
      : null,
    // « Publications » belongs to the Fil only (Modèle B recruteur, M3).
    want("publications") && (fil || dans === "publications") ? searchPosts(db, user.id, q) : null,
  ]);
  const companyItems = (companies ?? []).map((company) => ({
    href: `/app/entreprises/${company.slug}`,
    title: company.name,
    sub: [company.sector, company.city].filter(Boolean).join(" · "),
    initials: initials(company.name),
    image: company.logo,
    org: true,
  }));
  const peopleItems = (people ?? []).map((person) => ({
    href: `/app/personnes/${person.id}`,
    title: person.name,
    sub: [person.title, person.company].filter(Boolean).join(" · "),
    initials: initials(person.name),
    image: person.image,
  }));
  const postItems = (posts ?? []).map((post) => ({
    href: `/app/fil/${post.id}`,
    title: post.body.length > 140 ? `${post.body.slice(0, 139)}…` : post.body,
    sub: post.by,
    post: true,
  }));
  const groups = [
    want("offres") && mine
      ? {
          title: t("groups.offers", { count: mine.offers.length }),
          items: mine.offers.map((offer) => ({
            href: offer.href,
            title: offer.title,
            sub: t("offerLine", {
              city: offer.city,
              status: t(`status.${offer.status}`),
              count: offer.applications,
            }),
            icon: "offres",
          })),
        }
      : null,
    want("candidats") && mine
      ? {
          title: t("groups.candidates", { count: mine.candidates.length }),
          items: mine.candidates.map((item) => ({ ...item, initials: initials(item.title) })),
        }
      : null,
    ...(fil && dans === "tout"
      ? // In the Fil (planche Recruteur-fil-recherche-texte), « Tout » shows people and companies
        // together, then the posts.
        [{ title: t("groups.peopleAndCompanies"), items: [...peopleItems, ...companyItems] }]
      : [
          companies
            ? { title: t("groups.companies", { count: companyItems.length }), items: companyItems }
            : null,
          people
            ? { title: t("groups.people", { count: peopleItems.length }), items: peopleItems }
            : null,
        ]),
    posts ? { title: t("groups.posts"), items: postItems } : null,
  ].filter((group) => group !== null && group.items.length > 0);
  return NextResponse.json({ groups }, { headers: { "Cache-Control": "private, no-store" } });
}
