import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PhoneCvEditor } from "@/components/phone/career/cv-editor";
import { MobileCvEditor } from "@/components/talent/cv/mobile-editor";
import { CvStudio } from "@/components/talent/cv/studio/studio";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.editor");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The CV studio, one address for every width: the phone editor below 768 px (planche talent-4
 * § 6, `.t-mob`), the studio in three panels on a tablet and a computer (planche studio-cv,
 * `.t-sc-studio`). Both read the same address (`?vue=`, `?partie=`, `?adapter=`).
 */
export default async function CvEditorPage({
  params,
  searchParams,
}: PageProps<"/app/career/cv/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  // The phone (Modèle B, planches Carrière-cv-editeur and -cv-adapter): the editor itself and
  // « Adapter à une offre »; each section and Orbi's changes keep their screens.
  const plain =
    !query.partie &&
    !query.adaptation &&
    !query.orbi &&
    !query.modifier &&
    !query.erreur &&
    !query.export;
  if (plain && (!query.vue || query.vue === "style") && (await isPhone())) {
    const adapter = typeof query.adapter === "string" ? query.adapter.slice(0, 60) : null;
    return (
      <PhoneCvEditor
        id={id}
        adapt={adapter === null ? null : adapter === "offre" || adapter === "texte" ? "" : adapter}
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
