import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhDiagnostic } from "@/components/phone/recruteur/candidatures";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCandidatures.diagnostic");
  return { title: t("title"), robots: { index: false } };
}

/**
 * « Diagnostic des CV » on the recruiter's phone (Modèle B recruteur M5, planche
 * Recruteur-cand-diagnostic). On a computer, the ATS of the offer shows the same reading.
 */
export default async function DiagnosticPage({
  searchParams,
}: PageProps<"/app/hire/candidats/diagnostic">) {
  const query = await searchParams;
  const offre = typeof query.offre === "string" ? query.offre : null;
  if (!(await isPhone())) redirect(offre ? `/app/hire/offres/${offre}/ats` : "/app/hire/candidats");
  const { ctx } = await requireHire("/app/hire/candidats/diagnostic", "readApplications");
  try {
    return await RhDiagnostic({ ctx, query });
  } catch (error) {
    if (error instanceof HireError) notFound();
    throw error;
  }
}
