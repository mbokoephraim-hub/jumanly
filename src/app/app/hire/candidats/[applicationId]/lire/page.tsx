import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhCvReader } from "@/components/phone/recruteur/cv-lecture";
import { previewData } from "@/features/cv/document";
import { loadCvSource } from "@/features/cv/source";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { originalCvRef } from "@/server/services/application-cv";

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
  const ref = await originalCvRef(application.cvSnapshot);
  const file = ref?.type === "pdf" || ref?.type === "image" ? ref.type : null;
  let preview = null;
  if (!file) {
    const source = await loadCvSource(db, "application", application.id);
    if (source) {
      const { data, demo } = await previewData(source);
      preview = demo ? null : { data, template: source.template, style: source.style };
    }
  }
  const title =
    (application.cvSnapshot as { title?: unknown } | null)?.title &&
    typeof (application.cvSnapshot as { title?: unknown }).title === "string"
      ? String((application.cvSnapshot as { title: string }).title)
      : t("title");
  return (
    <RhCvReader
      title={title}
      sub={t(file ? `kind.${file}` : "kind.jumanly")}
      back={{ href: back, label: t("back") }}
      fileUrl={`/app/hire/candidats/${application.id}/cv`}
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
