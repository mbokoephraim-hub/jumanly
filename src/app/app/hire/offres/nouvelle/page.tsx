import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { RecruiterWebPublish } from "@/components/recruiter/web-publish";
import { webPublishData } from "@/components/recruiter/web-publish-data";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";
import { PhoneRecruiterPublish } from "@/components/phone/recruteur/publier";
import { RhOffresTexts, rhPublishData } from "@/components/phone/recruteur/offres";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.form");
  return { title: t("seoNew"), robots: { index: false } };
}

/** « Publier une offre »: saved as a draft on the first « Continuer » that knows the place. */
export default async function NewOfferPage() {
  const { ctx, user } = await requireHire("/app/hire/offres/nouvelle", "manage", "publish");
  // On a phone, the four steps of Modèle B recruteur (lot M4, planches Recruteur-publier-1 to -4).
  if (await isPhone())
    return (
      <RhOffresTexts>
        <PhoneRecruiterPublish data={await rhPublishData(ctx, user.id, null, 1)} />
      </RhOffresTexts>
    );
  // On a computer or a tablet, the five steps of Modèle B (lot N2, captures 038 to 042).
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ rhWeb: { publish: messages.rhWeb.publish } }}>
      <RecruiterWebPublish data={await webPublishData(ctx, user.id, null, 1)} />
    </NextIntlClientProvider>
  );
}
