import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhCvReader } from "@/components/phone/recruteur/cv-lecture";
import { cvReadingOf } from "@/components/phone/recruteur/cv-lecture-data";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhFiche.reader");
  return { title: t("seo"), robots: { index: false } };
}

const BACK = /^\/app\/hire\/offres\/[a-z0-9]+\?[\w=&%-]*$/i;

/**
 * The CV of a candidate, read in the app (Ephraïm, 03/11/2026: « consulter doit demander de voir
 * juste comment se présentent les CV »). Only the recruiting team of the job's organization;
 * every reading is logged like a profile view.
 */
export default async function CandidateCvPage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]/lire">) {
  const { applicationId } = await params;
  const query = await searchParams;
  const { user, ctx } = await requireHire(
    `/app/hire/candidats/${applicationId}/lire`,
    "readApplications",
  );
  const application = await db.application.findFirst({
    where: { id: applicationId.slice(0, 60), job: { organizationId: ctx.organizationId } },
    select: { id: true, cvSnapshot: true, profileId: true, jobId: true },
  });
  if (!application) notFound();
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "cv.view",
      targetType: "talentProfile",
      targetId: application.profileId,
      organizationId: ctx.organizationId,
      metadata: { applicationId },
    },
  });
  const t = await getTranslations("phoneRhFiche.reader");
  const asked = typeof query.retour === "string" ? query.retour : "";
  const back = BACK.test(asked)
    ? asked
    : `/app/hire/offres/${application.jobId}?vue=candidats&fiche=${application.id}&partie=documents`;
  const { file, preview, title, fileUrl } = await cvReadingOf(application, t("title"));
  return (
    <RhCvReader
      title={title}
      sub={t(file ? `kind.${file}` : "kind.jumanly")}
      back={{ href: back, label: t("back") }}
      fileUrl={fileUrl}
      file={file}
      preview={preview}
      texts={{
        pages: t("pages", { title }),
        unreadable: t("unreadable"),
        empty: t("empty"),
        open: t("open"),
      }}
    />
  );
}
