import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JobFlow, type FlowQuery } from "@/components/recruiter/job-flow";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";
import { PhoneRecruiterPublish } from "@/components/phone/recruteur/publier";
import { RhOffresTexts, rhPublishData } from "@/components/phone/recruteur/offres";
import { getOrgJob, HireError } from "@/server/services/hire";
import { jobStepOf } from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.form");
  return { title: t("seoEdit"), robots: { index: false } };
}

const flat = (params: Record<string, string | string[] | undefined>): FlowQuery =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      typeof value === "string" ? value : undefined,
    ]),
  );

/** The four steps of an offer, filled with it (planches recruteur-1 CR1 to CR4). */
export default async function EditOfferPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/modifier">) {
  const [{ id }, raw] = await Promise.all([params, searchParams]);
  const query = flat(raw);
  const { ctx, user } = await requireHire(`/app/hire/offres/${id}/modifier`, "manage", "publish");
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  if (job.status === "closed" || job.status === "archived") notFound();
  if (await isPhone())
    return (
      <RhOffresTexts>
        <FreshOnEachVisit>
          <PhoneRecruiterPublish
            key={job.id}
            data={await rhPublishData(ctx, user.id, job.id, Number(query.etape) || 1)}
          />
        </FreshOnEachVisit>
      </RhOffresTexts>
    );
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true, banner: true, logo: true },
  });
  return (
    <FreshOnEachVisit>
      <JobFlow ctx={ctx} org={org} job={job} step={jobStepOf(query.etape)} query={query} />
    </FreshOnEachVisit>
  );
}
