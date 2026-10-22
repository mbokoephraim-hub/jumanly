import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { exploreSearch } from "@/server/services/explore";
import { RH_SEARCH_SCOPES, recruiterPhoneSearch } from "@/server/services/hire-phone";

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
  if (!parsed.success) return NextResponse.json({ groups: [] });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ groups: [] }, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return NextResponse.json({ groups: [] }, { status: 403 });
  const { q, dans } = parsed.data;
  const t = await getTranslations("phoneRh.search");
  const want = (scope: (typeof RH_SEARCH_SCOPES)[number]) => dans === "tout" || dans === scope;
  const [mine, companies, people] = await Promise.all([
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
  ]);
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
    companies
      ? {
          title: t("groups.companies", { count: companies.length }),
          items: companies.map((company) => ({
            href: `/app/entreprises/${company.slug}`,
            title: company.name,
            sub: [company.sector, company.city].filter(Boolean).join(" · "),
            initials: initials(company.name),
            image: company.logo,
            org: true,
          })),
        }
      : null,
    people
      ? {
          title: t("groups.people", { count: people.length }),
          items: people.map((person) => ({
            href: `/app/personnes/${person.id}`,
            title: person.name,
            sub: [person.title, person.company].filter(Boolean).join(" · "),
            initials: initials(person.name),
            image: person.image,
          })),
        }
      : null,
  ].filter((group) => group !== null && group.items.length > 0);
  return NextResponse.json({ groups }, { headers: { "Cache-Control": "private, no-store" } });
}
