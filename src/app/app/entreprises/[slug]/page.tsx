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
  const own =
    space && space.organizationId === company.id
      ? await (async () => {
          const tc = await getTranslations("phoneRhCompte.company");
          const admin = await orgAdmin(db, company.id);
          return {
            note:
              active && isOrgAdmin(active.role)
                ? tc("ownAdmin")
                : admin.name
                  ? tc("own", { admin: admin.name })
                  : tc("ownNoAdmin"),
            publish: space.canPublishAsOrg
              ? {
                  href: "/app/fil/publier?nom=entreprise",
                  label: tc("publish", { org: shortName(company.name) }),
                }
              : null,
          };
        })()
      : undefined;
  const { t } = words;
  const name = shortName(company.name);
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
          handle: [t("company.handle", { slug: handle }), company.sector, company.city]
            .filter(Boolean)
            .join(" · "),
          tagline: firstSentence(company.description),
          about: company.description?.trim() || null,
          size: company.size,
          sector: company.sector,
          seat: [company.city, company.country].filter(Boolean).join(", ") || null,
          since: format.dateTime(company.createdAt, { month: "long", year: "numeric" }),
          website: company.website?.startsWith("https://") ? company.website : null,
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
            href: member.visible ? `/app/personnes/${member.id}` : null,
            name: member.name,
            initials: initialsOf(member.name),
            tone: toneOf(member.name, false),
            image: member.image,
            title: member.title,
            link: member.link,
          })),
        }}
        posts={posts.map(fil.post)}
        targets={targets}
        own={own}
      />
    </ExplorerTexts>
  );
}
