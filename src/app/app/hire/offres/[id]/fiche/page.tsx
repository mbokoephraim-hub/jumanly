import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JobSheetReader } from "@/components/recruiter/job-sheet-reader";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError } from "@/server/services/hire";
import { jobSheetPagesOf } from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.sheet");
  return { title: t("seo"), robots: { index: false } };
}

/** The job sheet of an offer, read by its organization (planche r1plus `PDF_V`). */
export default async function OfferSheetPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/fiche">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx, space } = await requireHire(`/app/hire/offres/${id}/fiche`);
  const t = await getTranslations("hireOffers.detail");
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  if (!job.jobSheetKey) notFound();
  return (
    <JobSheetReader
      back={`/app/hire/offres/${job.id}`}
      backLabel={t("back")}
      org={space.organization.name}
      title={job.title}
      pages={jobSheetPagesOf(job.jobSheetText)}
      page={Number(query.page) || 1}
      pageHref={(page) => `/app/hire/offres/${job.id}/fiche?page=${page}`}
      downloadHref={`/api/offres/${job.slug}/fiche`}
    />
  );
}
