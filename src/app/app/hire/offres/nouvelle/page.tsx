import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { JobForm } from "@/components/hire/job-form";
import { requireHire } from "@/server/hire-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.jobForm");
  return { title: { absolute: t("title.new") }, robots: { index: false } };
}

export default async function NewJobPage({ searchParams }: PageProps<"/app/hire/offres/nouvelle">) {
  const params = await searchParams;
  await requireHire("/app/hire/offres/nouvelle", "manage");
  const t = await getTranslations("hire");
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/app/hire/offres" className="text-sm underline">
        {t("jobs.title")}
      </Link>
      <h1 className="text-h1">{t("jobForm.title.new")}</h1>
      <JobForm
        params={{
          erreur: one(params.erreur),
          champ: one(params.champ),
          inconnues: one(params.inconnues),
        }}
      />
    </div>
  );
}
