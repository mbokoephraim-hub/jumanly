import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PhoneCvEditor } from "@/components/phone/career/cv-editor";
import { CV_STEPS } from "@/components/phone/cv/frame";
import { PhoneCvSteps } from "@/components/phone/cv/steps";
import { MobileCvEditor } from "@/components/talent/cv/mobile-editor";
import { CvStudio } from "@/components/talent/cv/studio/studio";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.editor");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The CV studio, one address for every width: on the phone the four steps of docs/carriere-v3
 * (`?etape=`), each section's editor below 768 px (planche talent-4 § 6, `.t-mob`), the studio
 * in three panels on a tablet and a computer (planche studio-cv, `.t-sc-studio`). All read the
 * same address (`?etape=`, `?vue=`, `?partie=`, `?adapter=`).
 */
export default async function CvEditorPage({
  params,
  searchParams,
}: PageProps<"/app/career/cv/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  if (await isPhone()) {
    // « Adapter à une offre » keeps its screen (planche Carrière-cv-adapter).
    if (typeof query.adapter === "string" && !query.adaptation) {
      const adapter = query.adapter.slice(0, 60);
      return (
        <PhoneCvEditor id={id} adapt={adapter === "offre" || adapter === "texte" ? "" : adapter} />
      );
    }
    // The four steps of a CV (docs/carriere-v3): Contenu by default, Aperçu after an export
    // that failed; each section's editor (`?partie=`) and Orbi's changes keep their screens.
    const step = CV_STEPS.find((key) => key === query.etape);
    const plain =
      !query.partie && !query.adaptation && !query.orbi && !query.modifier && !query.erreur;
    if (step || query.export || (plain && (!query.vue || query.vue === "style")))
      return (
        <PhoneCvSteps
          id={id}
          step={step ?? (query.export ? "apercu" : query.vue === "style" ? "style" : "contenu")}
          query={query}
        />
      );
  }
  return (
    <>
      <div className="t-mob">
        <MobileCvEditor id={id} query={query} />
      </div>
      <CvStudio id={id} query={query} />
    </>
  );
}
