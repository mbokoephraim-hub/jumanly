import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ExploreCompany, ExploreOffer, ExplorePerson } from "@/server/services/explore";
import { initialsOf, shortName, toneOf } from "../fil/data";

/**
 * What the screens of Explorer show (Modèle B, lot B4), every word written on the server so that
 * the phone and the server agree on it.
 */
export type OfferView = {
  id: string;
  slug: string;
  href: string;
  title: string;
  company: string;
  companyHref: string;
  initials: string;
  /** Colour of the company (five, as in the mockup), always the same for the same name. */
  tone: number;
  logo: string | null;
  verified: boolean;
  city: string;
  /** « CDI · hybride ». */
  kind: string;
  /** « il y a 2 j ». */
  ago: string;
  score: number | null;
  domain: string | null;
  sector: string | null;
};

export type CompanyView = {
  slug: string;
  href: string;
  name: string;
  initials: string;
  tone: number;
  logo: string | null;
  banner: string | null;
  verified: boolean;
  sector: string | null;
  /** « Fintech · 8 offres » (cards) and « Fintech · Kinshasa · 8 offres » (lists). */
  line: string;
  listLine: string;
  offers: number;
};

export type PersonView = {
  id: string;
  href: string;
  name: string;
  initials: string;
  tone: number;
  image: string | null;
  line: string;
  reason: string;
  /** A ring around the people who share connections with the viewer (planche Offres). */
  ring: boolean;
  link: "none" | "sent" | "connected";
};

/**
 * Five colours of companies, as in the mockup (sapin, ambre, bleu, menthe, corail): computed from
 * the name, so always the same, and chosen so that the demo companies get the mockup's colours.
 */
export function companyTone(name: string) {
  let hash = 4;
  for (const char of name) hash = (hash * 6 + char.charCodeAt(0)) >>> 0;
  return hash % 5;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export async function explorerWords(now = new Date()) {
  const t = await getTranslations("phoneExplorer");
  const tf = await getTranslations("phoneFil");
  const ts = await getTranslations("access.onboarding.studies.field");
  const format = await getFormatter();

  /** « il y a 2 j », « hier », « il y a 4 h ». */
  const ago = (date: Date | null) => {
    if (!date) return "";
    const spent = now.getTime() - date.getTime();
    return format.relativeTime(date, {
      now,
      unit: spent < HOUR ? "minute" : spent < DAY ? "hour" : spent < 7 * DAY ? "day" : "week",
      style: "short",
    });
  };
  const contract = (value: string) =>
    tf.has(`contract.${value}` as "contract.cdi")
      ? tf(`contract.${value}` as "contract.cdi")
      : value;
  const remote = (value: string) =>
    tf.has(`remote.${value}` as "remote.hybrid") ? tf(`remote.${value}` as "remote.hybrid") : value;
  const kind = (row: { contractType: string; remote: string }) =>
    row.remote === "onsite"
      ? contract(row.contractType)
      : t("offerKind", { contract: contract(row.contractType), remote: remote(row.remote) });
  const domain = (key: string) => (ts.has(`${key}` as "data") ? ts(`${key}` as "data") : key);

  const offer = (row: ExploreOffer): OfferView => {
    const company = shortName(row.organization.name);
    return {
      id: row.id,
      slug: row.slug,
      href: `/app/jobs/${row.slug}`,
      title: row.title,
      company,
      companyHref: `/app/entreprises/${row.organization.slug}`,
      initials: initialsOf(company),
      tone: companyTone(company),
      logo: row.organization.logo,
      verified: row.organization.verifiedAt !== null,
      city: row.city,
      kind: kind(row),
      ago: ago(row.publishedAt),
      score: row.score,
      domain: row.domain,
      sector: row.organization.sector,
    };
  };

  const company = (row: ExploreCompany): CompanyView => {
    const name = shortName(row.name);
    const count = { count: row.offers };
    return {
      slug: row.slug,
      href: `/app/entreprises/${row.slug}`,
      name,
      initials: initialsOf(name),
      tone: companyTone(name),
      logo: row.logo,
      banner: row.banner,
      verified: row.verified,
      sector: row.sector,
      line: row.sector
        ? t("companyLine", { sector: row.sector, ...count })
        : t("companyLineNoSector", count),
      listLine: t("list.companyLine", {
        line: [row.sector, row.city].filter(Boolean).join(" · ") || name,
        ...count,
      }),
      offers: row.offers,
    };
  };

  const person = (row: ExplorePerson): PersonView => {
    const line =
      row.title && row.company
        ? t("person.line", { title: row.title, company: shortName(row.company) })
        : (row.title ?? (row.company ? shortName(row.company) : (row.city ?? "")));
    const reason =
      row.reason.kind === "mutual"
        ? t("reason.mutual", { count: row.reason.count })
        : row.reason.kind === "field"
          ? t("reason.field")
          : row.reason.kind === "city"
            ? t("reason.city", { city: row.reason.city })
            : now.getTime() - row.reason.at.getTime() < 7 * DAY
              ? t("reason.joined", { when: ago(row.reason.at) })
              : t("reason.joinedOn", {
                  date: format.dateTime(row.reason.at, { day: "numeric", month: "long" }),
                });
    return {
      id: row.id,
      href: `/app/personnes/${row.id}`,
      name: row.name,
      initials: initialsOf(row.name),
      tone: toneOf(row.name, false),
      image: row.image,
      line,
      reason,
      ring: row.reason.kind === "mutual",
      link: row.link,
    };
  };

  return { t, ago, kind, contract, remote, domain, offer, company, person };
}
