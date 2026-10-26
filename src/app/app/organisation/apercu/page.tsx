import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CompanyPreview, type CompanyPreviewData } from "@/components/entreprise/company-page";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { sizeKeyOf } from "@/server/services/admin-signup";
import { companyPagePreview } from "@/server/services/org-page";

const PAGE = "/app/organisation/apercu";
const tabs = ["apropos", "membres", "offres"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orgPage");
  return { title: t("preview"), robots: { index: false } };
}

/** Page entreprise · vue publique (étape 3, A3, capture 082), for the administrators. */
export default async function CompanyPreviewPage({
  searchParams,
}: PageProps<"/app/organisation/apercu">) {
  const query = await searchParams;
  const { ctx } = await requireHire(PAGE, "administer");
  const [preview, messages, ts, tj] = await Promise.all([
    companyPagePreview(db, ctx),
    getMessages(),
    getTranslations("adminSignup.company"),
    getTranslations("hireOffers.contract"),
  ]);
  const { org } = preview;
  const size = sizeKeyOf(org.size);
  const data: CompanyPreviewData = {
    org: {
      name: org.name,
      logo: org.logo,
      banner: org.banner,
      bannerTheme: org.bannerTheme,
      description: org.description ?? "",
      website: org.website ?? "",
      hiringNow: org.hiringNow,
      verified: org.verifiedAt !== null,
    },
    line: [org.sector, org.city, size ? ts(`sizesLong.${size}`) : null].filter(Boolean).join(" · "),
    members: preview.members,
    offers: preview.offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      line: [tj(offer.contractType), offer.city].filter(Boolean).join(" · "),
    })),
  };
  const wanted = typeof query.onglet === "string" ? query.onglet : "";
  const initialTab = (tabs as readonly string[]).includes(wanted)
    ? (wanted as (typeof tabs)[number])
    : "apropos";
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["orgPage"])}>
      <CompanyPreview data={data} initialTab={initialTab} />
    </NextIntlClientProvider>
  );
}
