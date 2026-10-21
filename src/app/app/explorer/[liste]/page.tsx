import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CompanyRow, OfferRow, PersonRow } from "@/components/phone/explorer/cards";
import { explorerWords } from "@/components/phone/explorer/data";
import { ExplorerList } from "@/components/phone/explorer/list";
import { ExplorerTexts } from "@/components/phone/explorer/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { explorerHome, hiringCompanies, peopleToKnow } from "@/server/services/explore";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneExplorer");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const LISTS = ["offres", "nouvelles", "entreprises", "personnes"] as const;
type List = (typeof LISTS)[number];

/**
 * « Tout voir » of Explorer (lot B4, planches Offres-tout, -entreprises, -personnes): the whole
 * list of a section. On a computer, the offers page.
 */
export default async function ExplorerListPage({ params }: PageProps<"/app/explorer/[liste]">) {
  const { liste } = await params;
  if (!LISTS.includes(liste as List)) notFound();
  const list = liste as List;
  const user = await requireUser(`/app/explorer/${list}`);
  if (!(await isPhone())) redirect("/app/jobs");
  const now = new Date();
  const words = await explorerWords(now);
  const { t } = words;

  if (list === "entreprises") {
    const companies = await hiringCompanies(db, now, 100);
    const verified = companies.filter((company) => company.verified).length;
    return (
      <ExplorerTexts>
        <ExplorerList
          title={t("list.entreprises.title")}
          sub={
            verified === companies.length
              ? t("list.entreprises.sub", { count: verified })
              : t("list.entreprises.subAll", { count: companies.length })
          }
        >
          {companies.map(words.company).map((company) => (
            <CompanyRow key={company.slug} company={company} line={company.listLine} />
          ))}
        </ExplorerList>
      </ExplorerTexts>
    );
  }

  if (list === "personnes") {
    const people = await peopleToKnow(db, user.id, 40);
    return (
      <ExplorerTexts>
        <ExplorerList title={t("list.personnes.title")} sub={t("list.personnes.sub")}>
          {people.length === 0 ? <p className="nb-ex-vide">{t("noPeople")}</p> : null}
          {people.map(words.person).map((person) => (
            <PersonRow key={person.id} person={person} reason={false} />
          ))}
        </ExplorerList>
      </ExplorerTexts>
    );
  }

  const home = await explorerHome(db, user.id, now);
  const rows = (list === "offres" ? home.offers : home.fresh).map(words.offer);
  const ranked = rows.some((offer) => offer.score !== null);
  return (
    <ExplorerTexts>
      <ExplorerList
        title={t(`list.${list}.title`)}
        sub={
          list === "nouvelles"
            ? t("list.nouvelles.sub")
            : ranked
              ? t("list.offres.sub")
              : t("list.offres.subGeneral")
        }
      >
        {rows.length === 0 ? <p className="nb-ex-vide">{t("noOffers")}</p> : null}
        {rows.map((offer) => (
          <OfferRow
            key={offer.id}
            offer={offer}
            line={t("list.offerLine", {
              company: offer.company,
              city: offer.city,
              kind: offer.kind,
            })}
          />
        ))}
      </ExplorerList>
    </ExplorerTexts>
  );
}
