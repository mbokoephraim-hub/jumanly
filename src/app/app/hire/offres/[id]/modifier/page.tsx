import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { RecruiterWebPublish } from "@/components/recruiter/web-publish";
import { webPublishData } from "@/components/recruiter/web-publish-data";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";
import { PhoneRecruiterPublish } from "@/components/phone/recruteur/publier";
import { RhOffresTexts, rhPublishData } from "@/components/phone/recruteur/offres";
import { getOrgJob, HireError } from "@/server/services/hire";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.form");
  return { title: t("seoEdit"), robots: { index: false } };
}

/** The steps of « Publier une offre », filled with the offer. */
export default async function EditOfferPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/modifier">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const step = Number(typeof query.etape === "string" ? query.etape : "") || 1;
  const { ctx, user } = await requireHire(`/app/hire/offres/${id}/modifier`, "manage", "publish");
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  if (job.status === "closed" || job.status === "archived") notFound();
  if (await isPhone())
    return (
      <RhOffresTexts>
        <PhoneRecruiterPublish
          key={job.id}
          data={await rhPublishData(ctx, user.id, job.id, step)}
        />
      </RhOffresTexts>
    );
  // On a computer or a tablet, the five steps of Modèle B (lot N2, captures 038 to 042).
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ rhWeb: { publish: messages.rhWeb.publish } }}>
      <RecruiterWebPublish key={job.id} data={await webPublishData(ctx, user.id, job.id, step)} />
    </NextIntlClientProvider>
  );
}
