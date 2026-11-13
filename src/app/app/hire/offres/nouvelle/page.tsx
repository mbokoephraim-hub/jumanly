import { isModelB } from "@/server/phone-routes";
import { notFound } from "next/navigation";
import { isHireScope } from "@/lib/product-scope";
import { HireV3NewOffer } from "@/components/hire-v3/new-offer";
import { HireError } from "@/server/services/hire";
import { newOfferV3Data } from "@/server/services/hire-v3-offer";
import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JobFlow, type FlowQuery } from "@/components/recruiter/job-flow";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { PhoneRecruiterPublish } from "@/components/phone/recruteur/publier";
import { RhOffresTexts, rhPublishData } from "@/components/phone/recruteur/offres";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.form");
  return { title: t("seoNew"), robots: { index: false } };
}

const flat = (params: Record<string, string | string[] | undefined>): FlowQuery =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      typeof value === "string" ? value : undefined,
    ]),
  );

/** « Nouvelle offre », step 1 (planche recruteur-1 CR1): saved as a draft on « Continuer ». */
export default async function NewOfferPage({
  searchParams,
}: PageProps<"/app/hire/offres/nouvelle">) {
  const query = flat(await searchParams);
  const { ctx, user } = await requireHire("/app/hire/offres/nouvelle", "manage", "publish");
  // The web app v3 (prototype v3, `V.nouvelle`): the window to start, then the seven steps.
  if (isHireScope()) {
    const jobId = query.offre?.slice(0, 60) ?? null;
    const data = await newOfferV3Data(db, ctx, jobId).catch((error) => {
      if (error instanceof HireError) notFound();
      throw error;
    });
    if (data.job && (data.job.status === "closed" || data.job.status === "archived")) notFound();
    const raw = Number(query.etape);
    const step = data.job && Number.isInteger(raw) && raw >= 1 && raw <= 7 ? raw : 1;
    return (
      <FreshOnEachVisit>
        <HireV3NewOffer
          key={`${jobId ?? "new"}-${step}`}
          data={data}
          step={step}
          start={!data.job && !query.etape}
          query={query}
        />
      </FreshOnEachVisit>
    );
  }
  // On a phone, the four steps of Modèle B recruteur (lot M4, planches Recruteur-publier-1 to -4).
  if (await isModelB())
    return (
      <RhOffresTexts>
        <FreshOnEachVisit>
          <PhoneRecruiterPublish data={await rhPublishData(ctx, user.id, null, 1)} />
        </FreshOnEachVisit>
      </RhOffresTexts>
    );
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true, banner: true, logo: true },
  });
  return (
    <FreshOnEachVisit>
      <JobFlow ctx={ctx} org={org} job={null} step="poste" query={query} />
    </FreshOnEachVisit>
  );
}
