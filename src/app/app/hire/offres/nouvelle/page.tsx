import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { JobForm } from "@/components/hire/job-form";
import { JobFormBack, jobFormContext } from "@/components/hire/job-form-shell";
import { requireHire } from "@/server/hire-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.jobForm");
  return { title: t("title.new"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Guided job creation (mockup 04-03). */
export default async function NewJobPage({ searchParams }: PageProps<"/app/hire/offres/nouvelle">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/hire/offres/nouvelle", "manage");
  const t = await getTranslations("hire");
  const context = await jobFormContext(ctx);
  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <AppPageHeader eyebrow={<JobFormBack />} title={t("jobForm.title.new")} />
      <JobForm
        org={context.org}
        verified={context.verified}
        brand={context.brand}
        ai={context.ai}
        templates={context.templates}
        params={{
          erreur: one(params.erreur),
          champ: one(params.champ),
          inconnues: one(params.inconnues),
          etape: one(params.etape),
        }}
      />
    </div>
  );
}
