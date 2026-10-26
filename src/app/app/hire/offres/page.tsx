import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { listOffers } from "@/server/services/hire-offers";
import { RecruiterWebOffers } from "@/components/recruiter/web-offers";
import { isPhone } from "@/server/view";
import { RhNewOffer, RhTab } from "@/components/phone/recruteur/head";
import { RH_OFFER_FILTERS, RhOffersList, rhOffersLine } from "@/components/phone/recruteur/offres";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.list");
  return { title: t("seo"), robots: { index: false } };
}

const OK_TOASTS = ["brouillon", "pause", "reprise", "fermee", "supprimee"] as const;

/**
 * On a computer or a tablet, « Offres » of Modèle B (lot N2, captures 034 and 090): the figures,
 * the table of the offers and Orbi on the right.
 */
async function WebOffers({ searchParams }: PageProps<"/app/hire/offres">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/hire/offres");
  const t = await getTranslations("hireOffers");
  const ok = OK_TOASTS.find((value) => value === params.ok);
  return (
    <>
      {ok && <ToastOnLoad message={t(`list.ok.${ok}`)} tone="success" />}
      {params.limite || params.erreur === "limite" ? (
        <p className="rb-err rb-page-err" role="alert">
          {t("list.limit")}
        </p>
      ) : null}
      <RecruiterWebOffers ctx={ctx} />
    </>
  );
}

/**
 * On a phone, the Offres tab of Modèle B (docs/modele-b-recruteur, lot M4, planches
 * Recruteur-offres and -offres-encours): the line of figures, « Toutes · En cours · Terminées »
 * and one card per offer.
 */
async function PhoneOffers({ searchParams }: PageProps<"/app/hire/offres">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/hire/offres");
  const t = await getTranslations("hireOffers");
  const now = new Date();
  const offers = await listOffers(db, ctx, now);
  const filter = RH_OFFER_FILTERS.find((key) => key === params.vue) ?? "toutes";
  const ok = OK_TOASTS.find((value) => value === params.ok);
  return (
    <RhTab
      tab="offres"
      subtitle={await rhOffersLine(offers)}
      actions={hirePermissions(ctx.role).manage ? <RhNewOffer /> : null}
      legacy={false}
    >
      {ok && <ToastOnLoad message={t(`list.ok.${ok}`)} tone="success" />}
      {params.limite || params.erreur === "limite" ? (
        <p className="nb-erreur nb-rh-marge" role="alert">
          {t("list.limit")}
        </p>
      ) : null}
      <RhOffersList offers={offers} filter={filter} now={now} />
    </RhTab>
  );
}

export default async function HireOffersPage(props: PageProps<"/app/hire/offres">) {
  if (await isPhone()) return <PhoneOffers {...props} />;
  return <WebOffers {...props} />;
}
