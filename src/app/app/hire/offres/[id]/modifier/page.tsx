import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JobForm } from "@/components/hire/job-form";
import { JobStatusBadge } from "@/components/hire/job-status";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError } from "@/server/services/hire";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.jobForm");
  return { title: { absolute: t("title.edit") }, robots: { index: false } };
}

export default async function EditJobPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/modifier">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/modifier`, "manage");
  const t = await getTranslations("hire");
  const job = await getOrgJob(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  if (job.status === "closed" || job.status === "archived") notFound();
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/app/hire/offres" className="text-sm underline">
        {t("jobs.title")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-h1">{t("jobForm.title.edit")}</h1>
        <JobStatusBadge status={job.status} />
      </div>
      <JobForm
        job={job}
        params={{
          erreur: one(query.erreur),
          champ: one(query.champ),
          inconnues: one(query.inconnues),
          max: one(query.max),
          ok: one(query.ok),
        }}
      />
    </div>
  );
}
