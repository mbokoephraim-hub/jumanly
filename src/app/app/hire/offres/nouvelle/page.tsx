import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JobFlow, type FlowQuery } from "@/components/recruiter/job-flow";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";

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
  const { ctx } = await requireHire("/app/hire/offres/nouvelle", "manage");
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true, banner: true, logo: true },
  });
  return <JobFlow ctx={ctx} org={org} job={null} step="poste" query={query} />;
}
