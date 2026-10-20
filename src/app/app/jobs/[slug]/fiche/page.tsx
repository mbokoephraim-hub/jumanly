import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JobSheetReader } from "@/components/recruiter/job-sheet-reader";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPublicJob, isJobOpen } from "@/server/services/jobs";
import { jobSheetPagesOf } from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireOffers.sheet");
  return { title: t("seo"), robots: { index: false } };
}

/** The job sheet of an offer, read by a talent (planche r1plus `PDF_V`), with « Postuler ». */
export default async function TalentOfferSheetPage({
  params,
  searchParams,
}: PageProps<"/app/jobs/[slug]/fiche">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  await requireUser(`/app/jobs/${slug}/fiche`);
  const t = await getTranslations();
  const job = await getPublicJob(db, slug);
  if (!job?.jobSheetKey) notFound();
  return (
    <JobSheetReader
      back={`/app/jobs/${job.slug}`}
      backLabel={t("offer.back")}
      org={job.organization.name}
      title={job.title}
      pages={jobSheetPagesOf(job.jobSheetText)}
      page={Number(query.page) || 1}
      pageHref={(page) => `/app/jobs/${job.slug}/fiche?page=${page}`}
      downloadHref={`/api/offres/${job.slug}/fiche`}
      apply={
        isJobOpen(job) ? (
          <Link href={`/app/jobs/${job.slug}/postuler`} className="t-bt t-p t-pl t-press">
            {t("hireOffers.sheet.apply")}
          </Link>
        ) : undefined
      }
    />
  );
}
