import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { JobForm } from "@/components/hire/job-form";
import { JobFormBack, jobFormContext } from "@/components/hire/job-form-shell";
import { JobStatusBadge } from "@/components/hire/job-status";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError } from "@/server/services/hire";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.jobForm");
  return { title: t("title.edit"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** The same guided form, filled with the job (mockup 04-03). */
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
  const context = await jobFormContext(ctx, job.id);
  const ok = one(query.ok);
  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {ok === "brouillon" && <ToastOnLoad message={t("jobForm.draft.ok")} />}
      {ok === "copie" && <ToastOnLoad message={t("jobForm.draft.copied")} />}
      <AppPageHeader
        eyebrow={<JobFormBack />}
        title={t("jobForm.title.edit")}
        actions={<JobStatusBadge status={job.status} />}
      />
      <JobForm
        job={job}
        org={context.org}
        verified={context.verified}
        brand={context.brand}
        ai={context.ai}
        templates={context.templates}
        params={{
          erreur: one(query.erreur),
          champ: one(query.champ),
          inconnues: one(query.inconnues),
          max: one(query.max),
          ok,
          etape: one(query.etape),
        }}
      />
    </div>
  );
}
