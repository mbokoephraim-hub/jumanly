import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { PhoneCompany } from "@/components/phone/explorer/company";
import { companyTone, explorerWords } from "@/components/phone/explorer/data";
import { ExplorerTexts } from "@/components/phone/explorer/server";
import { feedWords, initialsOf, shortName, toneOf } from "@/components/phone/fil/data";
import { sendTargetViews } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { countryCode, countryName, flagOf } from "@/lib/countries";
import { bannerBackground } from "@/lib/entreprise";
import { SOCIAL_KINDS } from "@/lib/social-links";
import { getActiveSpace, publishingSpace } from "@/server/hire-context";
import { companyPage } from "@/server/services/explore";
import { authorFeed } from "@/server/services/feed";
import { isOrgAdmin, orgAdmin } from "@/server/services/hire-phone-account";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/** The first sentence of a presentation, for the line under the name (planche Entreprise). */
function firstSentence(text: string | null) {
  const clean = text?.trim();
  if (!clean) return null;
  const end = clean.search(/[.!?](\s|$)/);
  return end > 0 && end < 160 ? clean.slice(0, end + 1) : clean.length <= 160 ? clean : null;
}

/**
 * A company's page on the phone (Modèle B, lot B4, planche Entreprise): who it is, its posts, its
 * presentation, its open offers ranked for the person, and its members. On a computer, the public
 * page of the organization.
 */
export default async function OrganizationPage({ params }: PageProps<"/app/entreprises/[slug]">) {
  const { slug } = await params;
  const user = await requireUser(`/app/entreprises/${slug}`);
  if (!(await isPhone())) redirect(`/entreprises/${slug}`);
  const now = new Date();
  const [company, fil, words, targets, format] = await Promise.all([
    companyPage(db, user.id, slug, now),
    feedWords(user.id, now),
    explorerWords(now),
    sendTargetViews(user.id),
    getFormatter(),
  ]);
  if (!company) notFound();
  const [posts, space, active] = await Promise.all([
    authorFeed(db, user.id, { organizationId: company.id }),
    publishingSpace(user.id),
    getActiveSpace(user.id),
  ]);
  // The recruiter's own company (Modèle B recruteur M8, planche Recruteur-entreprise): who
  // administers the page, edited on a computer, and « Publier au nom de … ».
  const admin = Boolean(
    space && space.organizationId === company.id && active && isOrgAdmin(active.role),
  );
  const own =
    space && space.organizationId === company.id
      ? await (async () => {
          const tc = await getTranslations("phoneRhCompte.company");
          const owner = await orgAdmin(db, company.id);
          return {
            note: admin
              ? tc("ownAdmin")
              : owner.name
                ? tc("own", { admin: owner.name })
                : tc("ownNoAdmin"),
            edit: admin ? "/app/hire/entreprise/profil" : null,
            publish: space.canPublishAsOrg ? "/app/fil/publier?nom=entreprise" : null,
          };
        })()
      : undefined;
  const { t } = words;
  const name = shortName(company.name);
  // The seat with its flag (« 🇨🇩 Kinshasa, RD Congo »), or « International ».
  const code = countryCode(company.country);
  const country = code ? countryName(code) : company.country?.trim() || null;
  const place = company.international
    ? null
    : code || company.city
      ? {
          flag: code ? flagOf(code) : "",
          flagLabel: country ? t("company.flag", { country }) : "",
          text:
            company.city && country
              ? t("company.place", { city: company.city, country })
              : (company.city ?? country ?? ""),
        }
      : null;
  const socials = SOCIAL_KINDS.filter((kind) => kind !== "website" && company.socialLinks[kind])
    .map((kind) => ({
      kind,
      href: company.socialLinks[kind]!,
      label: t(`company.social.${kind}`),
    }))
    .concat(
      company.website?.startsWith("https://")
        ? [
            {
              kind: "website" as const,
              href: company.website,
              label: t("company.social.website"),
            },
          ]
        : [],
    );
  const domains = [
    ...new Set(
      (company.sector ?? "")
        .split(/[,;·/]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  const year = now.getUTCFullYear();
  const age = company.foundedYear ? year - company.foundedYear : null;
  const handle = company.slug
    .replace(/^ux-/, "")
    .replace(/-fictive?$/, "")
    .replace(/-/g, "");
  return (
    <ExplorerTexts>
      <PhoneCompany
        company={{
          slug: company.slug,
          name,
          initials: initialsOf(name),
          tone: companyTone(name),
          logo: company.logo,
          banner: company.banner,
          verified: company.verified,
          handle: t("company.handle", { slug: handle }),
          bannerColor: bannerBackground(null, company.bannerTheme),
          socials,
          place,
          international: company.international,
          hiringNow: company.hiringNow,
          domains,
          founded: company.foundedYear
            ? {
                year: t("company.foundedValue", { year: String(company.foundedYear) }),
                age:
                  age && age > 0
                    ? t("company.age", { count: age })
                    : age === 0
                      ? t("company.newBorn")
                      : null,
              }
            : null,
          tagline: firstSentence(company.description),
          about: company.description?.trim() || null,
          size: company.size,
          sector: company.sector,
          seat: company.international
            ? t("company.international")
            : place
              ? `${place.flag ? `${place.flag} ` : ""}${place.text}`
              : null,
          since: format.dateTime(company.createdAt, { month: "long", year: "numeric" }),
          website: company.website?.startsWith("https://") ? company.website : null,
          websiteLabel: company.website
            ? company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
            : null,
          followers: company.followers,
          following: company.following,
          offers: company.offers.map((row) => {
            const view = words.offer(row);
            return {
              view,
              line: t("company.offerLine", { city: view.city, kind: view.kind }),
            };
          }),
          members: company.members.map((member) => ({
            id: member.id,
            href: member.self
              ? `/app/personnes/${member.id}?apercu=1`
              : `/app/personnes/${member.id}`,
            name: member.name,
            initials: initialsOf(member.name),
            tone: toneOf(member.name, false),
            image: member.image,
            title: member.title,
            link: member.link,
            role: t(`company.role.${member.role as "org_owner" | "org_admin" | "recruiter"}`),
            self: member.self,
          })),
        }}
        posts={posts.map(fil.post)}
        targets={targets}
        own={own}
      />
    </ExplorerTexts>
  );
}
